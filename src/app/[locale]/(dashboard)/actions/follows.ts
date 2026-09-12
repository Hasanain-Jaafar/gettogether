"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "./notifications";

export type FollowResult =
  | { success: true; following: boolean }
  | { success: false; error: string };

export type FollowRelation = {
  id: string;
  name: string | null;
  avatar_url: string | null;
};

export async function toggleFollow(targetUserId: string): Promise<FollowResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };
  if (user.id === targetUserId) return { success: false, error: "Cannot follow yourself." };

  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId);
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    return { success: true, following: false };
  }

  const { error } = await supabase.from("follows").insert({
    follower_id: user.id,
    following_id: targetUserId,
  });
  if (error) return { success: false, error: error.message };

  await createNotification({
    userId: targetUserId,
    type: "follow",
    actorId: user.id,
  });

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  return { success: true, following: true };
}

export async function getFollowing(userId: string): Promise<FollowRelation[]> {
  const supabase = await createClient();

  // Get following IDs first
  const { data: follows, error: followsError } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false });

  if (followsError || !follows?.length) return [];

  const followingIds = follows.map((f) => f.following_id);

  // Get profiles for following IDs
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .in("id", followingIds);

  if (profilesError) return [];

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

  return (
    follows.map((f) => {
      const profile = profileMap.get(f.following_id);
      return {
        id: f.following_id,
        name: profile?.name ?? null,
        avatar_url: profile?.avatar_url ?? null,
      };
    }) ?? []
  );
}

export async function getFollowers(userId: string): Promise<FollowRelation[]> {
  const supabase = await createClient();

  // Get follower IDs first
  const { data: follows, error: followsError } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("following_id", userId)
    .order("created_at", { ascending: false });

  if (followsError || !follows?.length) return [];

  const followerIds = follows.map((f) => f.follower_id);

  // Get profiles for follower IDs
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .in("id", followerIds);

  if (profilesError) return [];

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

  return (
    follows.map((f) => {
      const profile = profileMap.get(f.follower_id);
      return {
        id: f.follower_id,
        name: profile?.name ?? null,
        avatar_url: profile?.avatar_url ?? null,
      };
    }) ?? []
  );
}

export async function getWhoToFollow(
  userId: string,
  limit: number = 5
): Promise<{ user: FollowRelation; mutualFollowers: number }[]> {
  const supabase = await createClient();

  // Candidate selection, exclusion and mutual-follower counting all happen
  // in one query server-side (see migrations/032_who_to_follow_rpc.sql)
  // instead of 3 sequential round trips from here.
  const { data, error } = await supabase.rpc("get_who_to_follow", {
    p_user_id: userId,
    p_limit: limit,
  });

  if (error || !data?.length) return [];

  type WhoToFollowRow = {
    id: string;
    name: string | null;
    avatar_url: string | null;
    mutual_followers: number | null;
  };

  return (data as WhoToFollowRow[]).map((row) => ({
    user: {
      id: row.id,
      name: row.name,
      avatar_url: row.avatar_url,
    },
    mutualFollowers: row.mutual_followers ?? 0,
  }));
}

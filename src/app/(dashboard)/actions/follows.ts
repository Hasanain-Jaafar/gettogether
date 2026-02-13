"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

  // Get users that the current user is following
  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  const followingIds = following?.map((f) => f.following_id) ?? [];
  followingIds.push(userId); // Exclude self

  // Get potential users to follow
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .not("id", "in", `(${followingIds.join(",")})`)
    .limit(limit * 3); // Get more to filter

  if (!profiles?.length) return [];

  const results: { user: FollowRelation; mutualFollowers: number }[] = [];

  for (const profile of profiles) {
    // Get count of mutual followers
    const { count } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .in("follower_id", followingIds)
      .eq("following_id", profile.id);

    results.push({
      user: {
        id: profile.id,
        name: profile.name,
        avatar_url: profile.avatar_url,
      },
      mutualFollowers: count ?? 0,
    });
  }

  // Sort by mutual followers and take top results
  return results
    .sort((a, b) => b.mutualFollowers - a.mutualFollowers)
    .slice(0, limit);
}

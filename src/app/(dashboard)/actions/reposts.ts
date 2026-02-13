"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type RepostResult =
  | { success: true; repostId: string; count: number }
  | { success: false; error: string };

export async function createRepost(
  postId: string,
  content: string | null = null
): Promise<RepostResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  // Check if user already reposted
  const { data: existing } = await supabase
    .from("reposts")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "Already reposted." };
  }

  // Check if original post exists
  const { data: originalPost } = await supabase
    .from("posts")
    .select("id")
    .eq("id", postId)
    .single();

  if (!originalPost) {
    return { success: false, error: "Post not found." };
  }

  const { data, error } = await supabase
    .from("reposts")
    .insert({
      post_id: postId,
      user_id: user.id,
      content: content?.trim() ?? null,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  // Get repost count
  const { count } = await supabase
    .from("reposts")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId);

  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return { success: true, repostId: data.id, count: count ?? 0 };
}

export async function deleteRepost(postId: string): Promise<RepostResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("reposts")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  // Get repost count
  const { count } = await supabase
    .from("reposts")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId);

  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return { success: true, repostId: "", count: count ?? 0 };
}

export async function getReposts(postId: string, limit: number = 10): Promise<any[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reposts")
    .select("id, user_id, content, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];

  if (!data?.length) return [];

  // Get user profiles
  const userIds = [...new Set(data.map((r) => r.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .in("id", userIds);

  const profileMap = new Map(profiles?.map((pr) => [pr.id, pr]) ?? []);

  return data.map((repost) => ({
    ...repost,
    author:
      profileMap.get(repost.user_id) ?? {
        id: repost.user_id,
        name: null,
        avatar_url: null,
      },
  }));
}

export async function getUserRepostCount(userId: string): Promise<number> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("reposts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  return count ?? 0;
}

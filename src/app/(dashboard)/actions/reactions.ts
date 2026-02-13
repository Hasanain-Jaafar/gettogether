"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ReactionResult =
  | { success: true; reaction: { emoji: string; count: number } | null }
  | { success: false; error: string };

export type PostReaction = {
  emoji: string;
  count: number;
  userReacted?: boolean;
};

export const COMMON_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡", "🎉", "🔥"];

export async function setReaction(
  postId: string,
  emoji: string
): Promise<ReactionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  // Check if user already has any reaction on this post
  const { data: existing } = await supabase
    .from("reactions")
    .select("id, emoji")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  // If user is changing their reaction to the same one, remove it
  if (existing && existing.emoji === emoji) {
    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("id", existing.id);
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    return { success: true, reaction: null };
  }

  // If user has a different reaction, delete it first
  if (existing) {
    const { error: deleteError } = await supabase
      .from("reactions")
      .delete()
      .eq("id", existing.id);
    if (deleteError) return { success: false, error: deleteError.message };
  }

  // Add the new reaction
  const { error } = await supabase.from("reactions").insert({
    post_id: postId,
    user_id: user.id,
    emoji,
  });
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/profile");

  // Get the reaction count
  const { data: reactions } = await supabase
    .from("reactions")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId)
    .eq("emoji", emoji);

  const count = reactions?.length ?? 0;

  return {
    success: true,
    reaction: { emoji, count },
  };
}

export async function removeReaction(
  postId: string,
  emoji: string
): Promise<ReactionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("reactions")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .eq("emoji", emoji);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return { success: true, reaction: null };
}

export async function getPostReactions(
  postId: string
): Promise<PostReaction[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: reactions, error } = await supabase
    .from("reactions")
    .select("emoji")
    .eq("post_id", postId);

  if (error) return [];

  // Count reactions by emoji
  const reactionCounts = new Map<string, { count: number; userReacted: boolean }>();

  // Get user's reactions
  let userReactions: string[] = [];
  if (user) {
    const { data: userReactionsData } = await supabase
      .from("reactions")
      .select("emoji")
      .eq("post_id", postId)
      .eq("user_id", user.id);
    userReactions = userReactionsData?.map((r) => r.emoji) ?? [];
  }

  reactions?.forEach((r) => {
    const existing = reactionCounts.get(r.emoji) ?? { count: 0, userReacted: false };
    reactionCounts.set(r.emoji, {
      count: existing.count + 1,
      userReacted: existing.userReacted || userReactions.includes(r.emoji),
    });
  });

  return Array.from(reactionCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .map(([emoji, data]) => ({
      emoji,
      count: data.count,
      userReacted: data.userReacted,
    }));
}

export async function getUserReactionsOnPosts(
  userId: string,
  postIds: string[]
): Promise<Map<string, string[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reactions")
    .select("post_id, emoji")
    .eq("user_id", userId)
    .in("post_id", postIds);

  if (error) return new Map();

  const userReactions = new Map<string, string[]>();
  data?.forEach((r) => {
    const existing = userReactions.get(r.post_id) ?? [];
    existing.push(r.emoji);
    userReactions.set(r.post_id, existing);
  });

  return userReactions;
}

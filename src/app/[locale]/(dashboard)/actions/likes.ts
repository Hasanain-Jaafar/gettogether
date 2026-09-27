"use server";

import { createClient } from "@/lib/supabase/server";
import { createNotification } from "./notifications";

// No revalidatePath here: the buttons that call these update optimistically
// from the returned count, and revalidating /dashboard made every tap
// re-render and re-download the entire feed.
export type LikeResult =
  | { success: true; liked: boolean; count: number }
  | { success: false; error: string };

export async function toggleCommentLike(commentId: string): Promise<LikeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data: existing } = await supabase
    .from("comment_likes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", user.id);
    if (error) return { success: false, error: error.message };
    const { count } = await supabase
      .from("comment_likes")
      .select("id", { count: "exact", head: true })
      .eq("comment_id", commentId);
    return { success: true, liked: false, count: count ?? 0 };
  }

  const { error } = await supabase.from("comment_likes").insert({
    comment_id: commentId,
    user_id: user.id,
  });
  if (error) return { success: false, error: error.message };
  const { count } = await supabase
    .from("comment_likes")
    .select("id", { count: "exact", head: true })
    .eq("comment_id", commentId);
  return { success: true, liked: true, count: count ?? 0 };
}

export async function toggleLike(postId: string): Promise<LikeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
    if (error) return { success: false, error: error.message };
    const { count } = await supabase
      .from("likes")
      .select("id", { count: "exact", head: true })
      .eq("post_id", postId);
    return { success: true, liked: false, count: count ?? 0 };
  }

  const { error } = await supabase.from("likes").insert({
    post_id: postId,
    user_id: user.id,
  });
  if (error) return { success: false, error: error.message };
  const { count } = await supabase
    .from("likes")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId);

  const { data: post } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .maybeSingle();
  if (post && post.user_id !== user.id) {
    await createNotification({
      userId: post.user_id,
      type: "like",
      actorId: user.id,
      postId,
    });
  }

  return { success: true, liked: true, count: count ?? 0 };
}

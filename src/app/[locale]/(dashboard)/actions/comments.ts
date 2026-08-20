"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createCommentSchema, updateCommentSchema } from "@/lib/validations/comment";
import { createNotification } from "./notifications";
import { notifyMentionedUsers } from "./mentions";

export type CommentResult = { success: true } | { success: false; error: string };

export async function createComment(
  postId: string,
  input: { content: string; parent_id?: string | null }
): Promise<CommentResult> {
  const parsed = createCommentSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input.";
    return { success: false, error: msg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  let parentAuthorId: string | null = null;
  if (parsed.data.parent_id) {
    const { data: parent } = await supabase
      .from("comments")
      .select("user_id, post_id")
      .eq("id", parsed.data.parent_id)
      .maybeSingle();
    if (!parent || parent.post_id !== postId) {
      return { success: false, error: "Invalid parent comment." };
    }
    parentAuthorId = parent.user_id;
  }

  const { data: inserted, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      content: parsed.data.content.trim(),
      parent_id: parsed.data.parent_id ?? null,
    })
    .select("id")
    .single();
  if (error) return { success: false, error: error.message };

  const { data: post } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .maybeSingle();
  const notified = new Set<string>([user.id]);
  if (parentAuthorId && !notified.has(parentAuthorId)) {
    await createNotification({
      userId: parentAuthorId,
      type: "comment",
      actorId: user.id,
      postId,
      commentId: inserted?.id,
    });
    notified.add(parentAuthorId);
  }
  if (post && !notified.has(post.user_id)) {
    await createNotification({
      userId: post.user_id,
      type: "comment",
      actorId: user.id,
      postId,
      commentId: inserted?.id,
    });
    notified.add(post.user_id);
  }

  const mentioned = await notifyMentionedUsers(postId, parsed.data.content, user.id, {
    createNotifications: false,
  });
  for (const uid of mentioned.notified) {
    if (notified.has(uid)) continue;
    await createNotification({
      userId: uid,
      type: "mention",
      actorId: user.id,
      postId,
      commentId: inserted?.id,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  return { success: true };
}

export async function updateComment(
  commentId: string,
  input: { content: string }
): Promise<CommentResult> {
  const parsed = updateCommentSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input.";
    return { success: false, error: msg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("comments")
    .update({ content: parsed.data.content.trim() })
    .eq("id", commentId)
    .eq("user_id", user.id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  return { success: true };
}

export async function deleteComment(commentId: string): Promise<CommentResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  return { success: true };
}

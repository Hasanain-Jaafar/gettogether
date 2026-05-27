"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createCommentSchema, updateCommentSchema } from "@/lib/validations/comment";
import { createNotification } from "./notifications";
import { notifyMentionedUsers } from "./mentions";

export type CommentResult = { success: true } | { success: false; error: string };

export async function createComment(
  postId: string,
  input: { content: string }
): Promise<CommentResult> {
  const parsed = createCommentSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors?.[0] ?? "Invalid input.";
    return { success: false, error: msg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data: inserted, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      content: parsed.data.content.trim(),
    })
    .select("id")
    .single();
  if (error) return { success: false, error: error.message };

  const { data: post } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .maybeSingle();
  if (post && post.user_id !== user.id) {
    await createNotification({
      userId: post.user_id,
      type: "comment",
      actorId: user.id,
      postId,
      commentId: inserted?.id,
    });
  }

  const mentioned = await notifyMentionedUsers(postId, parsed.data.content, user.id, {
    createNotifications: false,
  });
  const skip = new Set<string>([user.id]);
  if (post?.user_id) skip.add(post.user_id);
  for (const uid of mentioned.notified) {
    if (skip.has(uid)) continue;
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
    const msg = parsed.error.flatten().formErrors?.[0] ?? "Invalid input.";
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

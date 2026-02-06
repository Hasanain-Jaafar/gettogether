"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type LikeResult =
  | { success: true; liked: boolean; count: number }
  | { success: false; error: string };

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
    revalidatePath("/dashboard");
    revalidatePath("/profile");
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
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  return { success: true, liked: true, count: count ?? 0 };
}

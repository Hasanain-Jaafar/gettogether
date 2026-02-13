"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BookmarkResult =
  | { success: true; bookmarked: boolean; count: number }
  | { success: false; error: string };

export async function toggleBookmark(postId: string): Promise<BookmarkResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
    if (error) return { success: false, error: error.message };
    const { count } = await supabase
      .from("bookmarks")
      .select("id", { count: "exact", head: true })
      .eq("post_id", postId);
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    return { success: true, bookmarked: false, count: count ?? 0 };
  }

  const { error } = await supabase.from("bookmarks").insert({
    post_id: postId,
    user_id: user.id,
  });
  if (error) return { success: false, error: error.message };
  const { count } = await supabase
    .from("bookmarks")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId);
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  return { success: true, bookmarked: true, count: count ?? 0 };
}

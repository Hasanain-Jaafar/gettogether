"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPostSchema, updatePostSchema } from "@/lib/validations/post";

const RATE_LIMIT_POSTS_PER_HOUR = 10;

export type PostResult = { success: true; postId?: string } | { success: false; error: string };

export async function createPost(
  input: { content: string; image_url?: string | null }
): Promise<PostResult> {
  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors?.[0] ?? "Invalid input.";
    return { success: false, error: msg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { count } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

  if (count !== null && count >= RATE_LIMIT_POSTS_PER_HOUR) {
    return { success: false, error: "Rate limit: try again later." };
  }

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      content: parsed.data.content.trim(),
      image_url: parsed.data.image_url ?? null,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  return { success: true, postId: post.id };
}

export async function updatePost(
  postId: string,
  input: { content: string; image_url?: string | null }
): Promise<PostResult> {
  const parsed = updatePostSchema.safeParse(input);
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
    .from("posts")
    .update({
      content: parsed.data.content.trim(),
      image_url: parsed.data.image_url ?? null,
    })
    .eq("id", postId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath(`/u/${user.id}`);
  return { success: true };
}

export async function deletePost(postId: string): Promise<PostResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath(`/u/${user.id}`);
  return { success: true };
}

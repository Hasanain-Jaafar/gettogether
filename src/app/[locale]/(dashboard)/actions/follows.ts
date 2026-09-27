"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "./notifications";

export type FollowResult =
  | { success: true; following: boolean }
  | { success: false; error: string };

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

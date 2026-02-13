"use server";

import { createClient } from "@/lib/supabase/server";

export async function createTestNotification(userId: string) {
  const supabase = await createClient();

  // Create a test notification for debugging
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type: "like",
    actor_id: userId, // Self-notification for testing
    read: false,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

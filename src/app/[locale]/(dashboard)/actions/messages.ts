"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SendMessageResult =
  | { success: true; messageId: string }
  | { success: false; error: string };

export type ConversationResult =
  | { success: true; conversationId: string }
  | { success: false; error: string };

export async function getOrCreateConversation(
  otherUserId: string,
): Promise<ConversationResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_conversation", {
    other_user_id: otherUserId,
  });
  if (error || !data) {
    return { success: false, error: error?.message ?? "Failed." };
  }
  return { success: true, conversationId: data as string };
}

export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<SendMessageResult> {
  const trimmed = content.trim();
  if (!trimmed) return { success: false, error: "Empty message." };
  if (trimmed.length > 2000) return { success: false, error: "Message too long." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data: msg, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: trimmed,
    })
    .select("id")
    .single();
  if (error || !msg) return { success: false, error: error?.message ?? "Failed." };

  revalidatePath("/messages");
  return { success: true, messageId: msg.id };
}

export async function markConversationRead(
  conversationId: string,
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);
  return { success: true };
}

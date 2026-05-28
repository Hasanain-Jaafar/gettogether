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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };
  if (user.id === otherUserId) {
    return { success: false, error: "Cannot message yourself." };
  }

  // Find an existing 1:1 conversation containing both users.
  const { data: mine } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);
  const myIds = mine?.map((m) => m.conversation_id) ?? [];

  if (myIds.length > 0) {
    const { data: shared } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", otherUserId)
      .in("conversation_id", myIds);
    if (shared && shared.length > 0) {
      return { success: true, conversationId: shared[0].conversation_id };
    }
  }

  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .insert({})
    .select("id")
    .single();
  if (convErr || !conv) {
    return { success: false, error: convErr?.message ?? "Failed." };
  }

  const { error: partErr } = await supabase
    .from("conversation_participants")
    .insert([
      { conversation_id: conv.id, user_id: user.id },
      { conversation_id: conv.id, user_id: otherUserId },
    ]);
  if (partErr) return { success: false, error: partErr.message };

  return { success: true, conversationId: conv.id };
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

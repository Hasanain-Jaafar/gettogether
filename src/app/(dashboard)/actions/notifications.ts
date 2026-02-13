"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type Notification = {
  id: string;
  user_id: string;
  type: "like" | "comment" | "follow" | "repost" | "mention" | "poll";
  actor_id: string | null;
  post_id: string | null;
  comment_id: string | null;
  read: boolean;
  created_at: string;
  data: any;
  actor?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
};

export async function getNotifications(
  userId: string,
  limit: number = 50
): Promise<{ notifications: Notification[]; unreadCount: number }> {
  const supabase = await createClient();

  // Get notifications
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { notifications: [], unreadCount: 0 };
  }

  // Get unread count
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  // Get actor profiles
  const actorIds = [...new Set(notifications?.map((n) => n.actor_id).filter(Boolean) ?? [])];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .in("id", actorIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

  // Merge actor data into notifications
  const notificationsWithActors = (notifications ?? []).map((notification) => ({
    ...notification,
    actor: notification.actor_id ? profileMap.get(notification.actor_id) ?? null : null,
  }));

  return {
    notifications: notificationsWithActors,
    unreadCount: count ?? 0,
  };
}

export async function markAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllAsRead(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/notifications");
  return { success: true };
}

export async function createNotification(
  input: {
    userId: string;
    type: "like" | "comment" | "follow" | "repost" | "mention" | "poll";
    actorId?: string;
    postId?: string;
    commentId?: string;
    data?: any;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    actor_id: input.actorId ?? null,
    post_id: input.postId ?? null,
    comment_id: input.commentId ?? null,
    data: input.data ?? null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  return count ?? 0;
}

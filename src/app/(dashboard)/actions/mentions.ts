"use server";

import { createClient } from "@/lib/supabase/server";

export type SearchResult = {
  id: string;
  name: string | null;
  avatar_url: string | null;
};

export async function parseMentions(content: string): Promise<string[]> {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  return [...new Set(mentions)]; // Remove duplicates
}

export async function searchUsers(
  query: string,
  limit: number = 5
): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .ilike("name", `%${query}%`)
    .limit(limit);

  if (error) return [];

  return data ?? [];
}

export async function searchUsersByUsername(
  query: string,
  limit: number = 5
): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const supabase = await createClient();

  // Search by username (which we'll store as part of the name or add a separate column)
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .or(`name.ilike.%${query}%,id.eq.${query}`)
    .limit(limit);

  if (error) return [];

  return data ?? [];
}

export async function notifyMentionedUsers(
  postId: string,
  content: string,
  authorId: string
): Promise<{ success: boolean; notified: string[]; error?: string }> {
  const supabase = await createClient();

  const mentions = await parseMentions(content);

  if (mentions.length === 0) {
    return { success: true, notified: [] };
  }

  // Find users mentioned
  const userIds: string[] = [];
  for (const mention of mentions) {
    // Try to find by name or by exact ID match
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .ilike("name", mention)
      .limit(1);

    if (data?.[0]) {
      userIds.push(data[0].id);
    } else {
      // Try exact ID match
      const { data: idMatch } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", mention)
        .limit(1);

      if (idMatch?.[0]) {
        userIds.push(idMatch[0].id);
      }
    }
  }

  // Remove duplicates and author
  const uniqueUserIds = [...new Set(userIds)].filter((id) => id !== authorId);

  if (uniqueUserIds.length === 0) {
    return { success: true, notified: [] };
  }

  // Create notifications (we'll implement this in a future phase)
  // For now, just return the list of users who would be notified
  return { success: true, notified: uniqueUserIds };
}

export async function getUserMentions(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ mentions: any[]; total: number }> {
  const supabase = await createClient();

  // Get posts that mention this user
  const { data, error, count } = await supabase
    .from("posts")
    .select("id, user_id, content, image_url, created_at", { count: "exact" })
    .ilike("content", `%@${userId}%`)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return { mentions: [], total: 0 };

  // Get authors
  const postUserIds = [...new Set(data?.map((p) => p.user_id) ?? [])];
  const { data: authors } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .in("id", postUserIds);

  const authorMap = new Map(authors?.map((a) => [a.id, a]) ?? []);

  const mentions =
    data?.map((post) => ({
      ...post,
      author:
        authorMap.get(post.user_id) ?? {
          id: post.user_id,
          name: null,
          avatar_url: null,
        },
    })) ?? [];

  return { mentions, total: count ?? 0 };
}

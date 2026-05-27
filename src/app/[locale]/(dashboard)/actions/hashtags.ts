"use server";

import { createClient } from "@/lib/supabase/server";

export type TrendingTopic = {
  name: string;
  count: number;
  last_trending_at: string;
};

type PostWithUser = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
};

export async function extractHashtags(content: string): Promise<string[]> {
  const hashtagRegex = /#(\w+)/g;
  const hashtags: string[] = [];
  let match;
  while ((match = hashtagRegex.exec(content)) !== null) {
    hashtags.push(match[1]);
  }
  return hashtags;
}

export async function getTrendingTopics(
  limit: number = 10
): Promise<TrendingTopic[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("trending_topics")
    .select("name, count, last_trending_at")
    .order("count", { ascending: false })
    .limit(limit);

  if (error) return [];

  return data ?? [];
}

export async function updateTrendingTopics(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Call the database function to update trending topics
  const { error } = await supabase.rpc("update_trending_topics");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getPostsByHashtag(
  hashtag: string,
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ posts: PostWithUser[]; error?: string }> {
  const supabase = await createClient();

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, user_id, content, image_url, created_at")
    .ilike("content", `%#${hashtag}%`)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return { posts: [], error: error.message };

  if (!posts?.length) return { posts: [] };

  const userIds = [...new Set(posts.map((p) => p.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .in("id", userIds);

  const profileMap = new Map(profiles?.map((pr) => [pr.id, pr]) ?? []);

  const postsWithUsers = posts.map((post) => ({
    ...post,
    author:
      profileMap.get(post.user_id)?.id === post.user_id
        ? profileMap.get(post.user_id)
        : {
            id: post.user_id,
            name: null,
            avatar_url: null,
          },
  }));

  return { posts: postsWithUsers };
}

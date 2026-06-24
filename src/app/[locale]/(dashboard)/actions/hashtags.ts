"use server";

import { createClient } from "@/lib/supabase/server";

type PostWithUser = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  category: string;
  author?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    level?: number | null;
  } | null;
};

export async function getPostsByHashtag(
  hashtag: string,
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ posts: PostWithUser[]; error?: string }> {
  const supabase = await createClient();

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, user_id, content, image_url, video_url, created_at, category")
    .ilike("content", `%#${hashtag}%`)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return { posts: [], error: error.message };

  if (!posts?.length) return { posts: [] };

  const userIds = [...new Set(posts.map((p) => p.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, avatar_url, level")
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

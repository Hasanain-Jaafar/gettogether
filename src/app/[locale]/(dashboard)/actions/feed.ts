"use server";

import { createClient } from "@/lib/supabase/server";

export type PostWithUser = {
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

export type FeedResult = {
  posts: PostWithUser[];
  error?: string;
};

export async function getForYouFeed(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<FeedResult> {
  const supabase = await createClient();

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, user_id, content, image_url, created_at")
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
  })) as PostWithUser[];

  return { posts: postsWithUsers };
}

export async function getFollowingFeed(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<FeedResult> {
  const supabase = await createClient();

  // Get users that the current user is following
  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  const followingIds = following?.map((f) => f.following_id) ?? [];

  if (followingIds.length === 0) return { posts: [] };

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, user_id, content, image_url, created_at")
    .in("user_id", followingIds)
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
  })) as PostWithUser[];

  return { posts: postsWithUsers };
}

export async function getFilteredFeed(
  userId: string,
  filters: {
    hashtag?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<FeedResult> {
  const supabase = await createClient();
  const { hashtag, userId: targetUserId, limit = 20, offset = 0 } = filters;

  let query = supabase
    .from("posts")
    .select("id, user_id, content, image_url, created_at");

  // Filter by hashtag if provided
  if (hashtag) {
    query = query.ilike("content", `%#${hashtag}%`);
  }

  // Filter by user if provided
  if (targetUserId) {
    query = query.eq("user_id", targetUserId);
  }

  const { data: posts, error } = await query
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
  })) as PostWithUser[];

  return { posts: postsWithUsers };
}

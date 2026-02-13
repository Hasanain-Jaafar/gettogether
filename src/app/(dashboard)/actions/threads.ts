"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreateReplyResult =
  | { success: true; postId: string }
  | { success: false; error: string };

export type Reply = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  parent_post_id: string | null;
  is_reply: boolean;
  reply_count: number;
  author?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
};

export async function createReply(
  parentPostId: string,
  content: string,
  image_url: string | null = null
): Promise<CreateReplyResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  // Check if parent post exists
  const { data: parentPost } = await supabase
    .from("posts")
    .select("id")
    .eq("id", parentPostId)
    .single();

  if (!parentPost) {
    return { success: false, error: "Parent post not found." };
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      content,
      image_url,
      parent_post_id: parentPostId,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath("/post");

  return { success: true, postId: data.id };
}

export async function getThread(
  postId: string,
  userId: string
): Promise<{ post: Reply | null; replies: Reply[]; error?: string }> {
  const supabase = await createClient();

  // Get the main post
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, user_id, content, image_url, created_at, parent_post_id, is_reply, reply_count")
    .eq("id", postId)
    .single();

  if (postError) return { post: null, replies: [], error: postError.message };

  // Get author info
  const { data: author } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .eq("id", post.user_id)
    .single();

  const postWithAuthor: Reply = {
    ...post,
    author: author ?? {
      id: post.user_id,
      name: null,
      avatar_url: null,
    },
  };

  // Get replies
  const { data: replies, error: repliesError } = await supabase
    .from("posts")
    .select("id, user_id, content, image_url, created_at, parent_post_id, is_reply, reply_count")
    .eq("parent_post_id", postId)
    .order("created_at", { ascending: true });

  if (repliesError) return { post: postWithAuthor, replies: [] };

  // Get authors for replies
  const replyUserIds = [...new Set(replies?.map((r) => r.user_id) ?? [])];
  const { data: replyAuthors } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .in("id", replyUserIds);

  const authorMap = new Map(
    replyAuthors?.map((a) => [a.id, a]) ?? []
  );

  const repliesWithAuthors: Reply[] =
    replies?.map((reply) => ({
      ...reply,
      author:
        authorMap.get(reply.user_id) ?? {
          id: reply.user_id,
          name: null,
          avatar_url: null,
        },
    })) ?? [];

  return { post: postWithAuthor, replies: repliesWithAuthors };
}

export async function getReplies(
  postId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ replies: Reply[]; total: number; error?: string }> {
  const supabase = await createClient();

  const { data: replies, error } = await supabase
    .from("posts")
    .select("id, user_id, content, image_url, created_at, parent_post_id, is_reply, reply_count")
    .eq("parent_post_id", postId)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) return { replies: [], total: 0, error: error.message };

  // Get count
  const { count } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("parent_post_id", postId);

  // Get authors
  const replyUserIds = [...new Set(replies?.map((r) => r.user_id) ?? [])];
  const { data: replyAuthors } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .in("id", replyUserIds);

  const authorMap = new Map(
    replyAuthors?.map((a) => [a.id, a]) ?? []
  );

  const repliesWithAuthors: Reply[] =
    replies?.map((reply) => ({
      ...reply,
      author:
        authorMap.get(reply.user_id) ?? {
          id: reply.user_id,
          name: null,
          avatar_url: null,
        },
    })) ?? [];

  return { replies: repliesWithAuthors, total: count ?? 0 };
}

export async function getRecentThreads(limit: number = 10): Promise<Reply[]> {
  const supabase = await createClient();

  // Get posts with replies
  const { data, error } = await supabase
    .from("posts")
    .select("id, user_id, content, image_url, created_at, parent_post_id, is_reply, reply_count")
    .gt("reply_count", 0)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];

  // Get authors
  const userIds = [...new Set(data?.map((p) => p.user_id) ?? [])];
  const { data: authors } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .in("id", userIds);

  const authorMap = new Map(authors?.map((a) => [a.id, a]) ?? []);

  return (
    data?.map((post) => ({
      ...post,
      author:
        authorMap.get(post.user_id) ?? {
          id: post.user_id,
          name: null,
          avatar_url: null,
        },
    })) ?? []
  );
}

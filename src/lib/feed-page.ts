import { createClient } from "@/lib/supabase/server";
import type { PostCardProps } from "@/components/feed/post-card";
import type { PostCategory } from "@/lib/post-categories";

export const FEED_PAGE_SIZE = 20;

export type FeedPageFilters = {
  hashtag?: string | null;
  category?: PostCategory | null;
};

export type FeedPage = {
  items: PostCardProps[];
  // created_at of the last post on this page; pass it back as `before` to get the next page.
  nextCursor: string | null;
  hasMore: boolean;
};

// Loads one page of the dashboard feed, newest first, with everything PostCard
// needs (author, likes, likers, comments). Pages are keyed by created_at rather
// than offset so posts published while someone is scrolling don't shift the
// window and cause duplicates or gaps.
export async function loadFeedPage(
  currentUserId: string,
  filters: FeedPageFilters,
  before?: string | null
): Promise<FeedPage> {
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("id, user_id, content, image_url, image_width, image_height, video_url, video_orientation, created_at, category");
  if (filters.hashtag) query = query.ilike("content", `%#${filters.hashtag}%`);
  if (filters.category) query = query.eq("category", filters.category);
  if (before) query = query.lt("created_at", before);

  // Ask for one extra row so we know whether another page exists without a second query.
  const { data } = await query
    .order("created_at", { ascending: false })
    .limit(FEED_PAGE_SIZE + 1);

  const rows = data ?? [];
  const hasMore = rows.length > FEED_PAGE_SIZE;
  const posts = hasMore ? rows.slice(0, FEED_PAGE_SIZE) : rows;

  if (!posts.length) return { items: [], nextCursor: null, hasMore: false };

  const userIds = [...new Set(posts.map((p) => p.user_id))];
  const postIds = posts.map((p) => p.id);

  // likes and comments only depend on postIds, so fetch them together.
  const [{ data: likes }, { data: comments }] = await Promise.all([
    supabase.from("likes").select("post_id, user_id").in("post_id", postIds),
    supabase
      .from("comments")
      .select("id, post_id, content, created_at, user_id, parent_id")
      .in("post_id", postIds)
      .order("created_at", { ascending: true }),
  ]);

  const likeCountMap = new Map<string, number>();
  const userLikedSet = new Set<string>();
  const likesByPost = new Map<string, string[]>();
  likes?.forEach((l) => {
    likeCountMap.set(l.post_id, (likeCountMap.get(l.post_id) ?? 0) + 1);
    if (l.user_id === currentUserId) userLikedSet.add(l.post_id);

    const likers = likesByPost.get(l.post_id) ?? [];
    likers.push(l.user_id);
    likesByPost.set(l.post_id, likers);
  });

  const commentCountMap = new Map<string, number>();
  comments?.forEach((c) =>
    commentCountMap.set(c.post_id, (commentCountMap.get(c.post_id) ?? 0) + 1)
  );

  // Post authors, likers and commenters overlap heavily — fetch every profile
  // we'll need in one query instead of three, once we know who they all are.
  const likerUserIds = [...new Set(likes?.map((l) => l.user_id) ?? [])];
  const commentUserIds = [...new Set(comments?.map((c) => c.user_id) ?? [])];
  const allProfileIds = [...new Set([...userIds, ...likerUserIds, ...commentUserIds])];
  const commentIds = comments?.map((c) => c.id) ?? [];

  const [{ data: profiles }, { data: commentLikes }] = await Promise.all([
    supabase.from("profiles").select("id, name, avatar_url, level").in("id", allProfileIds),
    commentIds.length
      ? supabase.from("comment_likes").select("comment_id, user_id").in("comment_id", commentIds)
      : Promise.resolve({ data: [] as { comment_id: string; user_id: string }[] }),
  ]);

  const profileMap = new Map(profiles?.map((pr) => [pr.id, pr]) ?? []);

  const commentLikeCount = new Map<string, number>();
  const commentLikedByMe = new Set<string>();
  commentLikes?.forEach((l) => {
    commentLikeCount.set(l.comment_id, (commentLikeCount.get(l.comment_id) ?? 0) + 1);
    if (l.user_id === currentUserId) commentLikedByMe.add(l.comment_id);
  });

  const commentsByPost = new Map<string, PostCardProps["comments"]>();
  comments?.forEach((c) => {
    const list = commentsByPost.get(c.post_id) ?? [];
    list.push({
      ...c,
      author: profileMap.get(c.user_id) ?? null,
      like_count: commentLikeCount.get(c.id) ?? 0,
      liked_by_me: commentLikedByMe.has(c.id),
    });
    commentsByPost.set(c.post_id, list);
  });

  const items: PostCardProps[] = posts.map((post) => ({
    post,
    author: profileMap.get(post.user_id) ?? { name: null, avatar_url: null },
    likeCount: likeCountMap.get(post.id) ?? 0,
    commentCount: commentCountMap.get(post.id) ?? 0,
    currentUserLiked: userLikedSet.has(post.id),
    comments: commentsByPost.get(post.id) ?? [],
    currentUserId,
    likers:
      likesByPost
        .get(post.id)
        ?.map((userId) => profileMap.get(userId))
        .filter((profile) => profile !== undefined)
        .map(({ name, avatar_url }) => ({ name, avatar_url })) ?? [],
  }));

  return {
    items,
    nextCursor: posts[posts.length - 1].created_at,
    hasMore,
  };
}

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
//
// The whole page is assembled in one Postgres call (see
// migrations/033_feed_page_rpc.sql) instead of 3 sequential round trips.
export async function loadFeedPage(
  currentUserId: string,
  filters: FeedPageFilters,
  before?: string | null
): Promise<FeedPage> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_feed_page", {
    p_hashtag: filters.hashtag || null,
    p_category: filters.category || null,
    p_before: before || null,
    p_limit: FEED_PAGE_SIZE,
  });

  if (error) console.error("get_feed_page failed:", error.message);

  const page = data as { has_more: boolean; items: Omit<PostCardProps, "currentUserId">[] } | null;
  const rows = page?.items ?? [];
  if (!rows.length) return { items: [], nextCursor: null, hasMore: false };

  return {
    items: rows.map((item) => ({ ...item, currentUserId })),
    nextCursor: rows[rows.length - 1].post.created_at,
    hasMore: page?.has_more ?? false,
  };
}

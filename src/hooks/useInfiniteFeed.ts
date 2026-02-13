import { useState, useCallback, useEffect } from "react";
import { getForYouFeed, getFollowingFeed, type FeedResult } from "@/app/(dashboard)/actions/feed";

type PostWithMeta = {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  author?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
};

type UseInfiniteFeedOptions = {
  userId: string;
  tab?: "foryou" | "following";
  pageSize?: number;
  initialPosts?: PostWithMeta[];
};

type UseInfiniteFeedReturn = {
  posts: PostWithMeta[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
};

export function useInfiniteFeed({
  userId,
  tab = "foryou",
  pageSize = 20,
  initialPosts = [],
}: UseInfiniteFeedOptions): UseInfiniteFeedReturn {
  const [posts, setPosts] = useState<PostWithMeta[]>(initialPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(initialPosts.length);

  const fetchPosts = useCallback(
    async (currentOffset: number, isRefresh = false) => {
      if (isRefresh) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      try {
        const result =
          tab === "following"
            ? await getFollowingFeed(userId, pageSize, currentOffset)
            : await getForYouFeed(userId, pageSize, currentOffset);

        if (result.error) {
          setError(result.error);
        } else {
          if (isRefresh) {
            setPosts(result.posts);
            setOffset(result.posts.length);
            setHasMore(result.posts.length === pageSize);
          } else {
            setPosts((prev) => [...prev, ...result.posts]);
            setOffset((prev) => prev + result.posts.length);
            setHasMore(result.posts.length === pageSize);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load posts");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [userId, tab, pageSize]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    await fetchPosts(offset, false);
  }, [hasMore, isLoadingMore, offset, fetchPosts]);

  const refresh = useCallback(async () => {
    await fetchPosts(0, true);
  }, [fetchPosts]);

  useEffect(() => {
    if (initialPosts.length === 0) {
      fetchPosts(0, true);
    }
  }, [tab, userId]);

  return {
    posts,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
  };
}

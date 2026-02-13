"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { PostSkeleton } from "./post-skeleton";
import { PostCard, type PostCardProps } from "./post-card";

type PostWithFullData = Omit<PostCardProps, "post" | "author"> & {
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

type InfiniteScrollFeedProps = {
  posts: PostWithFullData[];
  hasMore: boolean;
  onLoadMore: () => void;
  loading?: boolean;
  layout?: "list" | "grid" | "compact";
  className?: string;
};

export function InfiniteScrollFeed({
  posts,
  hasMore,
  onLoadMore,
  loading = false,
  layout = "list",
  className,
}: InfiniteScrollFeedProps) {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  useEffect(() => {
    if (inView && hasMore && !loading) {
      onLoadMore();
    }
  }, [inView, hasMore, loading, onLoadMore]);

  const defaultAuthor = { name: null, avatar_url: null };

  const renderPostCard = (post: PostWithFullData) => {
    const { id, user_id, content, image_url, created_at, author, ...rest } = post;
    return (
      <PostCard
        key={id}
        post={{ id, user_id, content, image_url, created_at }}
        author={author ?? defaultAuthor}
        {...rest}
      />
    );
  };

  const renderFooter = () => (
    <>
      {loading && (
        <>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </>
      )}
      {hasMore && <div ref={ref} className="h-10" />}
      {!hasMore && posts.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          You&apos;re all caught up!
        </p>
      )}
    </>
  );

  if (layout === "list") {
    return (
      <div className={className}>
        {posts.map((post) => renderPostCard(post))}
        {renderFooter()}
      </div>
    );
  }

  if (layout === "grid") {
    return (
      <div className={className}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <div key={post.id}>{renderPostCard(post)}</div>
          ))}
        </div>
        {renderFooter()}
      </div>
    );
  }

  // Compact layout
  return (
    <div className={className}>
      {posts.map((post) => renderPostCard(post))}
      {renderFooter()}
    </div>
  );
}

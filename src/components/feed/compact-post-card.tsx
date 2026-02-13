"use client";

import Link from "next/link";
import { relativeTime, cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";

type CompactPostCardProps = {
  post: {
    id: string;
    content: string;
    image_url: string | null;
    created_at: string;
    user_id: string;
  };
  author: { name: string | null; avatar_url: string | null };
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  currentUserLiked: boolean;
  currentUserBookmarked: boolean;
  isVerified?: boolean;
  verificationType?: "individual" | "organization";
  className?: string;
};

function getInitials(name: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function CompactPostCard({
  post,
  author,
  likeCount,
  commentCount,
  bookmarkCount,
  currentUserLiked,
  currentUserBookmarked,
  className,
}: CompactPostCardProps) {
  const truncateContent = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + "...";
  };

  return (
    <Link
      href={`/post/${post.id}`}
      className={cn(
        "group flex gap-3 p-3 rounded-xl border border-border/80 bg-card/50 hover:border-primary/50 hover:bg-card/80 transition-all",
        className
      )}
    >
      {/* Author avatar */}
      <Link
        href={`/u/${post.user_id}`}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0"
      >
        <Avatar className="size-10">
          <AvatarImage src={author.avatar_url ?? undefined} />
          <AvatarFallback className="text-xs">
            {getInitials(author.name)}
          </AvatarFallback>
        </Avatar>
      </Link>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1">
        {/* Author name and time */}
        <div className="flex items-center gap-2">
          <Link
            href={`/u/${post.user_id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate"
          >
            {author.name ?? "Someone"}
          </Link>
          <span className="text-xs text-muted-foreground">
            {relativeTime(post.created_at)}
          </span>
        </div>

        {/* Post content */}
        <p className="text-sm text-foreground line-clamp-2">
          {truncateContent(post.content)}
        </p>

        {/* Engagement stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span
            className={cn(
              "flex items-center gap-1",
              currentUserLiked && "text-primary"
            )}
          >
            {likeCount} {likeCount === 1 ? "like" : "likes"}
          </span>
          <span>{commentCount} {commentCount === 1 ? "comment" : "comments"}</span>
          <span
            className={cn(
              currentUserBookmarked && "text-primary"
            )}
          >
            {bookmarkCount} {bookmarkCount === 1 ? "bookmark" : "bookmarks"}
          </span>
        </div>
      </div>

      {/* Thumbnail */}
      {post.image_url && (
        <div className="relative size-20 shrink-0 rounded-lg overflow-hidden bg-muted">
          <Image
            src={post.image_url}
            alt=""
            fill
            className="object-cover"
          />
        </div>
      )}
    </Link>
  );
}

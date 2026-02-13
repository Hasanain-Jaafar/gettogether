"use client";

import Link from "next/link";
import { Hash } from "lucide-react";

type HashtagLinkProps = {
  hashtag: string;
  count?: number;
  className?: string;
};

export function HashtagLink({ hashtag, count, className }: HashtagLinkProps) {
  return (
    <Link
      href={`/dashboard?hashtag=${hashtag}`}
      className={className}
    >
      <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-1 text-sm font-medium text-primary hover:bg-muted hover:underline transition-colors">
        <Hash className="size-3.5" />
        {hashtag}
        {count !== undefined && count > 0 && (
          <span className="text-xs text-muted-foreground">({count})</span>
        )}
      </span>
    </Link>
  );
}

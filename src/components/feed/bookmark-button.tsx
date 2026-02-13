"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { motion } from "framer-motion";
import { toggleBookmark } from "@/app/(dashboard)/actions/bookmarks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BookmarkButtonProps = {
  postId: string;
  initialCount: number;
  initialBookmarked: boolean;
  className?: string;
};

export function BookmarkButton({
  postId,
  initialCount,
  initialBookmarked,
  className,
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    const nextBookmarked = !bookmarked;
    const nextCount = count + (nextBookmarked ? 1 : -1);
    setBookmarked(nextBookmarked);
    setCount(nextCount);
    setLoading(true);
    const result = await toggleBookmark(postId);
    setLoading(false);
    if (!result.success) {
      setBookmarked(!nextBookmarked);
      setCount(count);
      toast.error(result.error);
    } else {
      toast.success(nextBookmarked ? "Post saved" : "Post removed from saved");
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "gap-1.5 rounded-xl text-muted-foreground hover:text-primary",
        bookmarked && "text-primary hover:text-primary/90",
        className
      )}
      onClick={handleClick}
      disabled={loading}
      title={bookmarked ? "Remove from saved" : "Save post"}
    >
      <motion.span
        animate={bookmarked ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.2 }}
      >
        {bookmarked ? (
          <BookmarkCheck className="size-4 fill-primary" strokeWidth={2.5} />
        ) : (
          <Bookmark className="size-4" strokeWidth={2} />
        )}
      </motion.span>
      <span>{count}</span>
    </Button>
  );
}

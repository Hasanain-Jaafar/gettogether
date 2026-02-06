"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { toggleLike } from "@/app/(dashboard)/actions/likes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LikeButtonProps = {
  postId: string;
  initialCount: number;
  initialLiked: boolean;
  className?: string;
};

export function LikeButton({
  postId,
  initialCount,
  initialLiked,
  className,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    const nextLiked = !liked;
    const nextCount = count + (nextLiked ? 1 : -1);
    setLiked(nextLiked);
    setCount(nextCount);
    setLoading(true);
    const result = await toggleLike(postId);
    setLoading(false);
    if (!result.success) {
      setLiked(!nextLiked);
      setCount(count);
      toast.error(result.error);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "gap-1.5 rounded-xl text-muted-foreground hover:text-primary",
        liked && "text-primary hover:text-primary/90",
        className
      )}
      onClick={handleClick}
      disabled={loading}
    >
      <motion.span
        animate={liked ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.2 }}
      >
        <Heart
          className={cn("size-4", liked && "fill-primary")}
          strokeWidth={liked ? 2.5 : 2}
        />
      </motion.span>
      <span>{count}</span>
    </Button>
  );
}

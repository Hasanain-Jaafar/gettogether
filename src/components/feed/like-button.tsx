"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Heart, Check } from "lucide-react";
import { motion } from "framer-motion";
import { toggleLike } from "@/app/(dashboard)/actions/likes";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type LikeButtonProps = {
  postId: string;
  initialCount: number;
  initialLiked: boolean;
  likers: { name: string | null; avatar_url: string | null }[];
  className?: string;
};

export function LikeButton({
  postId,
  initialCount,
  initialLiked,
  likers,
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
    <Popover>
      <PopoverTrigger asChild>
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
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-4"
        align="start"
        side="top"
      >
        <h3 className="text-sm font-semibold mb-3">
          {count === 0
            ? "No likes yet"
            : count === 1
              ? `${count} like`
              : `${count} likes`}
        </h3>
        {likers.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {likers.slice(0, 10).map((liker) => (
              <div
                key={liker.avatar_url || liker.name}
                className="flex items-center gap-2"
              >
                <Avatar className="size-8 shrink-0">
                  <AvatarImage src={liker.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {liker.name
                      ? liker.name.slice(0, 2).toUpperCase()
                      : "??"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-foreground">
                  {liker.name ?? "Someone"}
                </span>
              </div>
            ))}
            {likers.length > 10 && (
              <p className="text-xs text-muted-foreground text-center">
                +{likers.length - 10} more
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            Be the first to like this post! 💖
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

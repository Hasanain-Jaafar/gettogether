"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Smile } from "lucide-react";
import { motion } from "framer-motion";
import { setReaction, COMMON_REACTIONS, type PostReaction } from "@/app/(dashboard)/actions/reactions";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type ReactionPickerProps = {
  postId: string;
  reactions: PostReaction[];
  currentUserReactions: string[];
  onReactionChange?: () => void;
  className?: string;
};

export function ReactionPicker({
  postId,
  reactions,
  currentUserReactions,
  onReactionChange,
  className,
}: ReactionPickerProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleReaction(emoji: string) {
    if (loading) return;
    setLoading(emoji);
    const result = await setReaction(postId, emoji);
    setLoading(null);

    if (!result.success) {
      toast.error(result.error);
    } else {
      if (result.reaction) {
        toast.success(`Reacted with ${emoji}`);
      } else {
        toast.success("Reaction removed");
      }
      onReactionChange?.();
    }
  }

  function getReactionButtonState(emoji: string): {
    active: boolean;
    count: number;
  } {
    const reaction = reactions.find((r) => r.emoji === emoji);
    return {
      active: currentUserReactions.includes(emoji),
      count: reaction?.count ?? 0,
    };
  }

  const totalReactions = reactions.reduce((sum, r) => sum + r.count, 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-1.5 rounded-xl text-muted-foreground hover:text-primary",
            currentUserReactions.length > 0 && "text-primary hover:text-primary/90",
            className
          )}
        >
          <Smile className="size-4" />
          <span>{totalReactions}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start" side="top">
        <div className="flex flex-wrap gap-1">
          {COMMON_REACTIONS.map((emoji) => {
            const { active, count } = getReactionButtonState(emoji);
            return (
              <motion.button
                key={emoji}
                className={cn(
                  "relative flex size-10 items-center justify-center rounded-full text-xl transition-all hover:scale-110 hover:bg-muted/80 active:scale-95",
                  active && "bg-primary/20 ring-2 ring-primary"
                )}
                onClick={() => handleReaction(emoji)}
                disabled={loading === emoji}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>{emoji}</span>
                {count > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
                  >
                    {count}
                  </motion.span>
                )}
                {loading === emoji && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80">
                    <span className="size-3 animate-pulse rounded-full bg-primary" />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

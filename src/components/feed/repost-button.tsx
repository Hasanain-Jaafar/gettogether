"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Repeat2 } from "lucide-react";
import { motion } from "framer-motion";
import { createRepost, deleteRepost } from "@/app/(dashboard)/actions/reposts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RepostButtonProps = {
  postId: string;
  initialCount: number;
  initialReposted: boolean;
  className?: string;
};

export function RepostButton({
  postId,
  initialCount,
  initialReposted,
  className,
}: RepostButtonProps) {
  const [reposted, setReposted] = useState(initialReposted);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function handleRepost() {
    if (loading) return;
    const nextReposted = !reposted;
    setReposted(nextReposted);
    setCount(nextReposted ? count + 1 : count - 1);
    setLoading(true);
    const result = nextReposted
      ? await createRepost(postId)
      : await deleteRepost(postId);
    setLoading(false);

    if (!result.success) {
      setReposted(!nextReposted);
      setCount(nextReposted ? count - 1 : count + 1);
      toast.error(result.error);
    } else {
      toast.success(nextReposted ? "Reposted" : "Repost removed");
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "gap-1.5 rounded-xl text-muted-foreground hover:text-primary",
        reposted && "text-primary hover:text-primary/90",
        className
      )}
      onClick={handleRepost}
      disabled={loading}
      title={reposted ? "Remove repost" : "Repost"}
    >
      <motion.span
        animate={reposted ? { rotate: [0, 180] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Repeat2 className="size-4" />
      </motion.span>
      <span>{count}</span>
    </Button>
  );
}

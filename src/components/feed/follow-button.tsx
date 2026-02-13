"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, UserCheck } from "lucide-react";
import { motion } from "framer-motion";
import { toggleFollow } from "@/app/(dashboard)/actions/follows";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FollowButtonProps = {
  targetUserId: string;
  initialFollowing?: boolean;
  size?: "sm" | "default";
  variant?: "default" | "outline" | "ghost";
  className?: string;
};

export function FollowButton({
  targetUserId,
  initialFollowing = false,
  size = "sm",
  variant = "outline",
  className,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    const nextFollowing = !following;
    setFollowing(nextFollowing);
    setLoading(true);
    const result = await toggleFollow(targetUserId);
    setLoading(false);
    if (!result.success) {
      setFollowing(!nextFollowing);
      toast.error(result.error);
    } else {
      toast.success(nextFollowing ? "Following" : "Unfollowed");
    }
  }

  return (
    <Button
      variant={following ? "default" : variant}
      size={size}
      className={cn(
        "rounded-full",
        following && "bg-primary hover:bg-primary/90",
        className
      )}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <span className="size-4 animate-pulse" />
      ) : following ? (
        <>
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5"
          >
            <UserCheck className="size-4" />
            <span className="hidden sm:inline">Following</span>
          </motion.span>
        </>
      ) : (
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5"
        >
          <UserPlus className="size-4" />
          <span className="hidden sm:inline">Follow</span>
        </motion.span>
      )}
    </Button>
  );
}

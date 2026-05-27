"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleFollow } from "@/app/(dashboard)/actions/follows";

type FollowButtonProps = {
  targetUserId: string;
  initialFollowing: boolean;
};

export function FollowButton({
  targetUserId,
  initialFollowing,
}: FollowButtonProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  function onClick() {
    const next = !following;
    setFollowing(next); // optimistic
    startTransition(async () => {
      const result = await toggleFollow(targetUserId);
      if (!result.success) {
        setFollowing(!next);
        toast.error(result.error);
        return;
      }
      setFollowing(result.following);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={isPending}
      variant={following ? "outline" : "default"}
      className="rounded-full"
    >
      {following ? (
        <>
          <UserCheck className="size-4" /> Following
        </>
      ) : (
        <>
          <UserPlus className="size-4" /> Follow
        </>
      )}
    </Button>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Share, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ShareButtonProps = {
  postId: string;
  className?: string;
};

export function ShareButton({ postId, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/post/${postId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "gap-1.5 rounded-xl text-muted-foreground hover:text-primary",
        className
      )}
      onClick={handleShare}
      title="Copy link"
    >
      {copied ? (
        <Check className="size-4" strokeWidth={2.5} />
      ) : (
        <Share className="size-4" strokeWidth={2} />
      )}
    </Button>
  );
}

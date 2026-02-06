"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { createComment } from "@/app/(dashboard)/actions/comments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { relativeTime } from "@/lib/utils";

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author?: { name: string | null; avatar_url: string | null } | null;
};

type CommentSectionProps = {
  postId: string;
  initialComments: Comment[];
  commentCount: number;
};

function getInitials(name: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function CommentSection({
  postId,
  initialComments,
  commentCount,
}: CommentSectionProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    setSubmitting(true);
    const result = await createComment(postId, { content: trimmed });
    setSubmitting(false);
    if (result.success) {
      setContent("");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 rounded-xl text-muted-foreground hover:text-foreground shrink-0"
        onClick={() => setExpanded(!expanded)}
      >
        <MessageCircle className="size-4" />
        <span>{commentCount}</span>
      </Button>
      {expanded && (
        <div className="w-full flex-[1_1_100%] space-y-3 pt-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              placeholder="Add a comment…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[80px] flex-1 resize-y rounded-xl border-border bg-muted/30 text-sm"
              maxLength={1000}
              disabled={submitting}
            />
            <Button
              type="submit"
              size="sm"
              className="rounded-xl shrink-0"
              disabled={submitting || !content.trim()}
            >
              {submitting ? "…" : "Post"}
            </Button>
          </form>
          <ul className="space-y-2">
            {initialComments.map((c) => (
              <li key={c.id} className="flex gap-2 text-sm">
                <Avatar className="size-8 shrink-0">
                  <AvatarImage src={c.author?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(c.author?.name ?? null)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">
                    {c.author?.name ?? "Someone"}
                  </p>
                  <p className="text-muted-foreground whitespace-pre-wrap wrap-break-word">
                    {c.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {relativeTime(c.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

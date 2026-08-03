"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { Heart, MessageCircle } from "lucide-react";
import { createComment } from "@/app/[locale]/(dashboard)/actions/comments";
import { toggleCommentLike } from "@/app/[locale]/(dashboard)/actions/likes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { relativeTime } from "@/lib/utils";

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id?: string | null;
  like_count?: number;
  liked_by_me?: boolean;
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
  const t = useTranslations("feed.comments");
  const tPost = useTranslations("feed.post");
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [likeState, setLikeState] = useState<
    Record<string, { liked: boolean; count: number } | undefined>
  >({});

  function getLike(c: Comment) {
    return (
      likeState[c.id] ?? {
        liked: c.liked_by_me ?? false,
        count: c.like_count ?? 0,
      }
    );
  }

  async function handleToggleLike(c: Comment) {
    const current = getLike(c);
    const next = {
      liked: !current.liked,
      count: current.count + (current.liked ? -1 : 1),
    };
    setLikeState((s) => ({ ...s, [c.id]: next }));
    const result = await toggleCommentLike(c.id);
    if (!result.success) {
      setLikeState((s) => ({ ...s, [c.id]: current }));
      toast.error(result.error);
      return;
    }
    setLikeState((s) => ({
      ...s,
      [c.id]: { liked: result.liked, count: result.count },
    }));
  }

  const { roots, repliesByParent } = useMemo(() => {
    const roots: Comment[] = [];
    const repliesByParent = new Map<string, Comment[]>();
    for (const c of initialComments) {
      if (c.parent_id) {
        const arr = repliesByParent.get(c.parent_id) ?? [];
        arr.push(c);
        repliesByParent.set(c.parent_id, arr);
      } else {
        roots.push(c);
      }
    }
    return { roots, repliesByParent };
  }, [initialComments]);

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

  async function handleReplySubmit(parentId: string) {
    const trimmed = replyContent.trim();
    if (!trimmed) return;
    setReplySubmitting(true);
    const result = await createComment(postId, {
      content: trimmed,
      parent_id: parentId,
    });
    setReplySubmitting(false);
    if (result.success) {
      setReplyContent("");
      setReplyTo(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  function renderComment(c: Comment, isReply = false) {
    const replies = repliesByParent.get(c.id) ?? [];
    const isReplying = replyTo === c.id;
    return (
      <li key={c.id} className="space-y-2">
        <div className="flex gap-2 text-sm">
          <Avatar className={isReply ? "size-7 shrink-0" : "size-8 shrink-0"}>
            <AvatarImage src={c.author?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(c.author?.name ?? null)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">
              {c.author?.name ?? tPost("someone")}
            </p>
            <p className="text-muted-foreground whitespace-pre-wrap wrap-break-word">
              {c.content}
            </p>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                {relativeTime(c.created_at, locale)}
              </p>
              <button
                type="button"
                onClick={() => handleToggleLike(c)}
                className={cn(
                  "flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary",
                  getLike(c).liked && "text-primary",
                )}
                aria-label={t("like")}
              >
                <Heart
                  className={cn("size-3.5", getLike(c).liked && "fill-primary")}
                  strokeWidth={getLike(c).liked ? 2.5 : 2}
                />
                {getLike(c).count > 0 && <span>{getLike(c).count}</span>}
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplyTo(isReplying ? null : c.id);
                  setReplyContent("");
                }}
                className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              >
                {isReplying ? t("cancelReply") : t("reply")}
              </button>
            </div>
            {isReplying && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleReplySubmit(c.id);
                }}
                className="mt-2 flex gap-2"
              >
                <Textarea
                  placeholder={t("replyPlaceholder")}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[60px] flex-1 resize-y rounded-xl border-border bg-muted/30 text-sm"
                  maxLength={1000}
                  disabled={replySubmitting}
                  autoFocus
                />
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl shrink-0"
                  disabled={replySubmitting || !replyContent.trim()}
                >
                  {replySubmitting ? "…" : t("submit")}
                </Button>
              </form>
            )}
          </div>
        </div>
        {replies.length > 0 && (
          <ul className="ms-6 space-y-2 border-s border-border/60 ps-3">
            {replies.map((r) => renderComment(r, true))}
          </ul>
        )}
      </li>
    );
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
              placeholder={t("placeholder")}
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
              {submitting ? "…" : t("submit")}
            </Button>
          </form>
          <ul className="space-y-3">
            {roots.map((c) => renderComment(c))}
          </ul>
        </div>
      )}
    </>
  );
}

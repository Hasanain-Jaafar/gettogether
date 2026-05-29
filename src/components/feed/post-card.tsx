"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { LikeButton } from "@/components/feed/like-button";
import { CommentSection } from "@/components/feed/comment-section";
import { BookmarkButton } from "@/components/feed/bookmark-button";
import { ShareButton } from "@/components/feed/share-button";
import { VerifiedBadge } from "@/components/feed/verified-badge";
import { LevelBadge } from "@/components/profile/level-badge";
import { LeveledAvatar } from "@/components/profile/leveled-avatar";
import { RepostButton } from "@/components/feed/repost-button";
import { relativeTime } from "@/lib/utils";
import { deletePost, updatePost } from "@/app/[locale]/(dashboard)/actions/posts";
import { getVideoEmbed } from "@/lib/video-embed";
import { linkifyHashtags } from "@/lib/linkify-hashtags";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CommentWithAuthor = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id?: string | null;
  like_count?: number;
  liked_by_me?: boolean;
  author?: { name: string | null; avatar_url: string | null } | null;
};

export type PostCardProps = {
  post: {
    id: string;
    content: string;
    image_url: string | null;
    video_url: string | null;
    created_at: string;
    user_id: string;
  };
  author: { name: string | null; avatar_url: string | null; level?: number | null };
  isVerified?: boolean;
  verificationType?: "individual" | "organization" | "government" | null;
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  repostCount: number;
  currentUserLiked: boolean;
  currentUserBookmarked: boolean;
  currentUserReposted: boolean;
  comments: CommentWithAuthor[];
  currentUserId: string;
  likers: { name: string | null; avatar_url: string | null }[];
};

function VideoEmbed({ url }: { url: string }) {
  const embed = getVideoEmbed(url);
  if (!embed) return null;

  if (embed.kind === "youtube" || embed.kind === "tiktok" || embed.kind === "iframe") {
    const aspect = embed.kind === "tiktok" ? "aspect-[9/16] max-w-sm mx-auto" : "aspect-video";
    return (
      <div className={`mt-3 overflow-hidden rounded-xl bg-black ${aspect}`}>
        <iframe
          src={embed.embedSrc}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  if (embed.kind === "direct") {
    return (
      <div className="mt-3 overflow-hidden rounded-xl bg-muted">
        <video
          src={embed.src}
          controls
          playsInline
          preload="metadata"
          className="mx-auto block h-auto max-h-[600px] w-full"
        />
      </div>
    );
  }

  return (
    <a
      href={embed.href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 block truncate rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-sm text-primary hover:bg-muted/60"
    >
      {embed.href}
    </a>
  );
}

function getInitials(name: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function PostCard({
  post,
  author,
  isVerified = false,
  verificationType = "individual",
  likeCount,
  commentCount,
  bookmarkCount,
  repostCount,
  currentUserLiked,
  currentUserBookmarked,
  currentUserReposted,
  comments,
  currentUserId,
  likers,
}: PostCardProps) {
  const router = useRouter();
  const t = useTranslations("feed.post");
  const locale = useLocale();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isOwn = currentUserId === post.user_id;

  async function handleSaveEdit() {
    if (editContent.trim() === post.content) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const result = await updatePost(post.id, {
      content: editContent.trim(),
      image_url: post.image_url,
      video_url: post.video_url,
    });
    setSaving(false);
    if (result.success) {
      setEditing(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  function handleDelete() {
    setConfirmDeleteOpen(true);
  }

  async function confirmDelete() {
    setDeleting(true);
    const result = await deletePost(post.id);
    setDeleting(false);
    if (result.success) {
      setConfirmDeleteOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Card className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex items-start justify-between gap-2 p-4 pb-2">
          <Link
            href={`/u/${post.user_id}`}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <LeveledAvatar level={author.level ?? 1} className="size-10 shrink-0">
              <AvatarImage src={author.avatar_url ?? undefined} />
              <AvatarFallback className="text-sm">
                {getInitials(author.name)}
              </AvatarFallback>
            </LeveledAvatar>
            <div className="min-w-0">
              <p className="flex items-center gap-1 font-semibold text-foreground truncate">
                {author.name ?? t("someone")}
                {isVerified && (
                  <VerifiedBadge type={verificationType} size="sm" />
                )}
                {author.level != null && author.level > 1 && (
                  <LevelBadge level={author.level} size="sm" />
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {relativeTime(post.created_at, locale)}
              </p>
            </div>
          </Link>
          {isOwn && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full shrink-0"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditing(true)}>
                  <Pencil className="me-2 size-4" /> {t("edit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive"
                >
                  <Trash2 className="me-2 size-4" /> {t("delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="px-4 pb-3">
          {editing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-25 rounded-xl"
                maxLength={2000}
                disabled={saving}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="rounded-xl"
                  onClick={handleSaveEdit}
                  disabled={saving || !editContent.trim()}
                >
                  {saving ? t("saving") : t("save")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setEditing(false);
                    setEditContent(post.content);
                  }}
                  disabled={saving}
                >
                  {t("cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap wrap-break-word text-foreground">
                {linkifyHashtags(post.content)}
              </p>
              {post.image_url && (
                <div className="mt-3 overflow-hidden rounded-xl bg-muted">
                  {/\.(mp4|webm|mov|m4v)(\?|$)/i.test(post.image_url) ? (
                    <video
                      src={post.image_url}
                      controls
                      playsInline
                      preload="metadata"
                      className="mx-auto block h-auto max-h-[600px] w-full"
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={post.image_url}
                      alt="Post image"
                      loading="lazy"
                      className="mx-auto block h-auto max-h-[600px] w-full object-contain"
                    />
                  )}
                </div>
              )}
              {post.video_url && <VideoEmbed url={post.video_url} />}
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 px-4 py-3">
          <LikeButton
            postId={post.id}
            initialCount={likeCount}
            initialLiked={currentUserLiked}
            likers={likers}
          />
          <CommentSection
            postId={post.id}
            initialComments={comments}
            commentCount={commentCount}
          />
          <RepostButton
            postId={post.id}
            initialCount={repostCount}
            initialReposted={currentUserReposted}
          />
          <BookmarkButton
            postId={post.id}
            initialCount={bookmarkCount}
            initialBookmarked={currentUserBookmarked}
          />
          <ShareButton postId={post.id} />
        </div>
      </CardContent>

      <Dialog
        open={confirmDeleteOpen}
        onOpenChange={(o) => !deleting && setConfirmDeleteOpen(o)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("confirmDeleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("confirmDeleteDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={deleting}
              onClick={() => setConfirmDeleteOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-full"
              disabled={deleting}
              onClick={confirmDelete}
            >
              {deleting ? t("deleting") : t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

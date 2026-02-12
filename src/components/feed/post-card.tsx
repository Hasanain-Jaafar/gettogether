"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
import { relativeTime } from "@/lib/utils";
import { deletePost, updatePost } from "@/app/(dashboard)/actions/posts";
import { Textarea } from "@/components/ui/textarea";

type CommentWithAuthor = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author?: { name: string | null; avatar_url: string | null } | null;
};

export type PostCardProps = {
  post: {
    id: string;
    content: string;
    image_url: string | null;
    created_at: string;
    user_id: string;
  };
  author: { name: string | null; avatar_url: string | null };
  likeCount: number;
  commentCount: number;
  currentUserLiked: boolean;
  comments: CommentWithAuthor[];
  currentUserId: string;
  likers: { name: string | null; avatar_url: string | null }[];
};

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
  likeCount,
  commentCount,
  currentUserLiked,
  comments,
  currentUserId,
  likers,
}: PostCardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [saving, setSaving] = useState(false);
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
    });
    setSaving(false);
    if (result.success) {
      setEditing(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this post?")) return;
    const result = await deletePost(post.id);
    if (result.success) {
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
            <Avatar className="size-10 shrink-0">
              <AvatarImage src={author.avatar_url ?? undefined} />
              <AvatarFallback className="text-sm">
                {getInitials(author.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">
                {author.name ?? "Someone"}
              </p>
              <p className="text-xs text-muted-foreground">
                {relativeTime(post.created_at)}
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
                  <Pencil className="mr-2 size-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 size-4" /> Delete
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
                className="min-h-[100px] rounded-xl"
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
                  {saving ? "Saving…" : "Save"}
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
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap wrap-break-word text-foreground">
                {post.content}
              </p>
              {post.image_url && (
                <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-xl sm:aspect-auto sm:h-80">
                  <Image
                    src={post.image_url}
                    alt="Post image"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 600px, 800px"
                  />
                </div>
              )}
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
        </div>
      </CardContent>
    </Card>
  );
}

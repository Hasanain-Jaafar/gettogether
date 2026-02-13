"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Story = {
  id: string;
  user_id: string;
  author?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
  created_at: string;
};

type StoryBarProps = {
  stories: Story[];
  currentUserId: string;
  className?: string;
};

function getInitials(name: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function StoryBar({ stories, className }: StoryBarProps) {
  return (
    <div className={cn("flex gap-4 overflow-x-auto pb-4 scrollbar-hide", className)}>
      {/* Add story button */}
      <Link
        href="/stories/create"
        className="flex shrink-0 flex-col items-center gap-1.5"
      >
        <div className="relative">
          <Avatar className="size-16 ring-2 ring-border">
            <AvatarImage src="" />
            <AvatarFallback className="bg-muted">
              <Plus className="size-6" />
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Plus className="size-3" />
          </div>
        </div>
        <span className="text-xs text-muted-foreground">Add story</span>
      </Link>

      {/* Story items */}
      {stories.map((story) => (
        <Link
          key={story.id}
          href={`/stories/${story.id}`}
          className="flex shrink-0 flex-col items-center gap-1.5 group"
        >
          <div className="relative">
            {/* Ring for unread stories */}
            <div className="absolute -inset-1 rounded-full bg-linear-to-tr from-primary to-purple-500 opacity-80" />
            <Avatar className="relative size-16 border-2 border-background">
              <AvatarImage
                src={story.author?.avatar_url ?? undefined}
                alt={story.author?.name ?? ""}
              />
              <AvatarFallback className="text-xs">
                {getInitials(story.author?.name ?? null)}
              </AvatarFallback>
            </Avatar>
          </div>
          <span className="w-16 truncate text-center text-xs text-foreground group-hover:text-primary transition-colors">
            {story.author?.name ?? "Someone"}
          </span>
        </Link>
      ))}
    </div>
  );
}

// Helper component for story preview
type StoryPreviewProps = {
  story: Story;
  className?: string;
};

export function StoryPreview({
  story,
  className,
}: StoryPreviewProps) {
  return (
    <div className={cn("relative aspect-9/16 rounded-2xl overflow-hidden bg-muted", className)}>
      {/* Story content would go here */}
      <div className="absolute inset-0 bg-linear-to-b from-black/20 to-transparent" />

      {/* Author overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center gap-3">
        <Avatar className="size-10 ring-2 ring-white/20">
          <AvatarImage src={story.author?.avatar_url ?? undefined} />
          <AvatarFallback className="text-xs">
            {getInitials(story.author?.name ?? null)}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-semibold text-white">
          {story.author?.name ?? "Someone"}
        </span>
      </div>

      {/* Timestamp */}
      <div className="absolute bottom-4 left-4 right-4">
        <span className="text-xs text-white/80">
          {new Date(story.created_at).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

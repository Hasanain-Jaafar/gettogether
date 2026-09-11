"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function DashboardRealtime() {
  const router = useRouter();
  const t = useTranslations("feed.realtime");
  const [hasNewPosts, setHasNewPosts] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Only new posts affect what the feed looks like for everyone, so this is
    // the one change worth surfacing globally. Likes/comments/bookmarks/reposts
    // are already reflected optimistically in their own components and don't
    // need to push a refresh to every other open dashboard.
    const postsChannel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        () => setHasNewPosts(true)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, []);

  if (!hasNewPosts) return null;

  return (
    <button
      type="button"
      onClick={() => {
        setHasNewPosts(false);
        router.refresh();
      }}
      className={cn(
        "fixed left-1/2 top-20 z-30 -translate-x-1/2",
        "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium",
        "bg-primary text-primary-foreground shadow-lg shadow-primary/30",
        "hover:shadow-xl hover:shadow-primary/40 hover:scale-105 active:scale-95",
        "transition-all duration-200",
        "animate-[slide-up_0.3s_ease-out_forwards]"
      )}
    >
      <ArrowUp className="size-4" strokeWidth={2.5} />
      {t("newPosts")}
    </button>
  );
}

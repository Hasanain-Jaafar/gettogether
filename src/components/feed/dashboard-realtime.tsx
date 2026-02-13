"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function DashboardRealtime() {
  const router = useRouter();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(0);

  const debouncedRefresh = () => {
    const now = Date.now();
    const MIN_REFRESH_INTERVAL = 2000; // Minimum 2 seconds between refreshes

    // Clear any pending refresh
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Debounce the refresh by 500ms
    refreshTimeoutRef.current = setTimeout(() => {
      // Throttle: don't refresh if we just refreshed recently
      if (now - lastRefreshRef.current >= MIN_REFRESH_INTERVAL) {
        lastRefreshRef.current = Date.now();
        router.refresh();
      }
    }, 500);
  };

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to new likes
    const likesChannel = supabase
      .channel("likes-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "likes",
        },
        debouncedRefresh
      )
      .subscribe();

    // Subscribe to new comments
    const commentsChannel = supabase
      .channel("comments-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
        },
        debouncedRefresh
      )
      .subscribe();

    // Subscribe to new posts
    const postsChannel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
        },
        debouncedRefresh
      )
      .subscribe();

    // Subscribe to bookmarks
    const bookmarksChannel = supabase
      .channel("bookmarks-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
        },
        debouncedRefresh
      )
      .subscribe();

    // Subscribe to reposts
    const repostsChannel = supabase
      .channel("reposts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reposts",
        },
        debouncedRefresh
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(bookmarksChannel);
      supabase.removeChannel(repostsChannel);
    };
  }, [router]);

  return null;
}

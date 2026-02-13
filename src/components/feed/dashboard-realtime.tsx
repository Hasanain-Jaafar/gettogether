"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function DashboardRealtime() {
  const router = useRouter();

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
        () => {
          // Refresh the page to show updated like counts
          router.refresh();
        }
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
        () => {
          // Refresh the page to show updated comments
          router.refresh();
        }
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
        () => {
          // Refresh the page to show new posts
          router.refresh();
        }
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
        () => {
          // Refresh the page to show updated bookmark counts
          router.refresh();
        }
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
        () => {
          // Refresh the page to show updated repost counts
          router.refresh();
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(bookmarksChannel);
      supabase.removeChannel(repostsChannel);
    };
  }, [router]);

  return null;
}

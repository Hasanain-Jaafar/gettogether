"use client";

import { useEffect, useState } from "react";
import { TrendingSidebar } from "./trending-sidebar";
import { WhoToFollow } from "./who-to-follow";
import type { TrendingTopic } from "@/app/(dashboard)/actions/hashtags";

type WhoToFollowUser = {
  user: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
  mutualFollowers: number;
};

type DashboardSidebarProps = {
  trendingInitial?: TrendingTopic[];
  whoToFollowInitial?: WhoToFollowUser[];
};

export function DashboardSidebar({
  trendingInitial,
  whoToFollowInitial,
}: DashboardSidebarProps) {
  const [trending, setTrending] = useState<TrendingTopic[]>(trendingInitial || []);
  const [whoToFollow, setWhoToFollow] = useState<WhoToFollowUser[]>(whoToFollowInitial || []);

  useEffect(() => {
    // Load sidebar data after component mounts (non-blocking)
    const loadSidebarData = async () => {
      try {
        const [trendingRes, whoToFollowRes] = await Promise.all([
          fetch("/api/trending"),
          fetch("/api/who-to-follow"),
        ]);

        const trendingData = await trendingRes.json();
        const whoToFollowData = await whoToFollowRes.json();

        setTrending(trendingData.topics || []);
        setWhoToFollow(whoToFollowData.users || []);
      } catch (error) {
        console.error("Failed to load sidebar data:", error);
      }
    };

    loadSidebarData();
  }, []);

  return (
    <div className="space-y-6">
      <TrendingSidebar trending={trending} />
      <div id="who-to-follow">
        <WhoToFollow users={whoToFollow} />
      </div>
    </div>
  );
}

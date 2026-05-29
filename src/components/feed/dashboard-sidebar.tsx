import { TrendingSidebar } from "./trending-sidebar";
import { WhoToFollow } from "./who-to-follow";
import type { TrendingTopic } from "@/app/[locale]/(dashboard)/actions/hashtags";

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
  return (
    <div className="space-y-6">
      <TrendingSidebar trending={trendingInitial ?? []} />
      <div id="who-to-follow">
        <WhoToFollow users={whoToFollowInitial ?? []} />
      </div>
    </div>
  );
}

import { WhoToFollow } from "./who-to-follow";

type WhoToFollowUser = {
  user: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
  mutualFollowers: number;
};

type DashboardSidebarProps = {
  whoToFollowInitial?: WhoToFollowUser[];
};

export function DashboardSidebar({
  whoToFollowInitial,
}: DashboardSidebarProps) {
  return (
    <div className="space-y-6">
      <div id="who-to-follow">
        <WhoToFollow users={whoToFollowInitial ?? []} />
      </div>
    </div>
  );
}

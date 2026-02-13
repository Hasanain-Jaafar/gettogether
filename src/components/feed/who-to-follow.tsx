import { UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FollowButton } from "./follow-button";

type UserWithMutualFollowers = {
  user: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
  mutualFollowers: number;
};

type WhoToFollowProps = {
  users: UserWithMutualFollowers[];
  className?: string;
};

function getInitials(name: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function WhoToFollow({ users, className }: WhoToFollowProps) {
  if (users.length === 0) return null;

  return (
    <Card className={className}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="size-5 text-primary" />
          <h2 className="font-semibold">Who to Follow</h2>
        </div>
        <ul className="space-y-3">
          {users.map(({ user, mutualFollowers }) => (
            <li key={user.id}>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Avatar className="size-10 shrink-0">
                  <AvatarImage src={user.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate text-foreground">
                    {user.name ?? "Someone"}
                  </p>
                  {mutualFollowers > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {mutualFollowers} mutual {mutualFollowers === 1 ? "follower" : "followers"}
                    </p>
                  )}
                </div>
                <FollowButton targetUserId={user.id} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

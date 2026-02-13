import { MessageSquare, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type EmptyStateProps = {
  type?: "no-posts" | "no-results" | "welcome";
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  type = "no-posts",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const states = {
    "no-posts": {
      icon: MessageSquare,
      title: "No posts yet",
      description: "Be the first to share something with the community!",
    },
    "no-results": {
      icon: Sparkles,
      title: "No results found",
      description: "Try adjusting your search or filters.",
    },
    "welcome": {
      icon: Users,
      title: "Welcome to the community!",
      description: "Start by creating your first post or explore what others are sharing.",
    },
  };

  const { icon: Icon, title, description } = states[type];

  return (
    <Card className="border-border/80 bg-card p-12 shadow-sm">
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
          <Icon className="size-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            {description}
          </p>
        </div>
        {actionLabel && onAction && (
          <Button onClick={onAction} className="rounded-xl mt-2">
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}

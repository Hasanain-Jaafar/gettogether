"use client";

import { useTranslations } from "next-intl";
import { MessageSquare, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type EmptyStateProps = {
  type?: "no-posts" | "no-results" | "welcome";
  actionLabel?: string;
  actionTarget?: "focus-create-post" | "scroll-who-to-follow";
};

export function EmptyState({
  type = "no-posts",
  actionLabel,
  actionTarget,
}: EmptyStateProps) {
  const t = useTranslations("feed.empty");

  const states = {
    "no-posts": {
      icon: MessageSquare,
      title: t("noPostsTitle"),
      description: t("noPostsDescription"),
    },
    "no-results": {
      icon: Sparkles,
      title: t("noResultsTitle"),
      description: t("noResultsDescription"),
    },
    "welcome": {
      icon: Users,
      title: t("welcomeTitle"),
      description: t("welcomeDescription"),
    },
  };

  const { icon: Icon, title, description } = states[type];

  const handleAction = () => {
    if (actionTarget === "scroll-who-to-follow") {
      document
        .getElementById("who-to-follow")
        ?.scrollIntoView({ behavior: "smooth" });
    } else if (actionTarget === "focus-create-post") {
      document.querySelector<HTMLTextAreaElement>("textarea")?.focus();
    }
  };

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
        {actionLabel && actionTarget && (
          <Button onClick={handleAction} className="rounded-xl mt-2">
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}

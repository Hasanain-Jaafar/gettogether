"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type LevelBadgeProps = {
  level: number;
  size?: "sm" | "default";
  className?: string;
};

function tierClasses(level: number): string {
  if (level >= 15) return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
  if (level >= 5) return "bg-primary/10 text-primary";
  return "bg-muted text-muted-foreground";
}

export function LevelBadge({ level, size = "default", className }: LevelBadgeProps) {
  const t = useTranslations("level");
  if (!level || level < 1) return null;

  const iconSize = size === "sm" ? "size-3" : "size-3.5";
  const padding = size === "sm" ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-xs";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full font-semibold leading-none",
        padding,
        tierClasses(level),
        className,
      )}
      aria-label={t("label", { n: level })}
      title={t("label", { n: level })}
    >
      <Star className={cn(iconSize, "fill-current")} />
      {level}
    </span>
  );
}

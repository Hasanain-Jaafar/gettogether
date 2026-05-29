"use client";

import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type LeveledAvatarProps = {
  level: number;
  className?: string;
  children: React.ReactNode;
  /** If false, only show the colored dot without the level number (for tiny avatars). */
  showChipNumber?: boolean;
};

function tierRingClasses(level: number): string {
  if (level >= 15) {
    return "bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700";
  }
  if (level >= 5) {
    return "bg-gradient-to-br from-primary via-fuchsia-500 to-primary";
  }
  if (level >= 2) {
    return "bg-gradient-to-br from-orange-300 to-orange-700";
  }
  return "bg-muted";
}

function tierChipClasses(level: number): string {
  if (level >= 15) return "bg-amber-500 text-white";
  if (level >= 5) return "bg-primary text-primary-foreground";
  if (level >= 2) return "bg-orange-600 text-white";
  return "bg-muted-foreground/80 text-background";
}

function isLargeAvatar(className: string | undefined): boolean {
  if (!className) return false;
  // size-16 / size-20 / size-24 / size-28 / size-32 etc.
  return /\bsize-(1[6-9]|[2-9]\d)\b/.test(className);
}

export function LeveledAvatar({
  level,
  className,
  children,
  showChipNumber = true,
}: LeveledAvatarProps) {
  const t = useTranslations("level");
  const safeLevel = Math.max(1, Math.floor(level || 1));
  const large = isLargeAvatar(className);
  const ringPadding = large ? "p-[3px]" : "p-[2px]";
  const chipSize = large ? "size-6 text-[11px]" : "size-4 text-[10px]";

  return (
    <span
      className="relative inline-block rounded-full"
      aria-label={t("label", { n: safeLevel })}
      title={t("label", { n: safeLevel })}
    >
      <span className={cn("inline-block rounded-full", ringPadding, tierRingClasses(safeLevel))}>
        <Avatar className={cn("ring-2 ring-background", className)}>{children}</Avatar>
      </span>
      <span
        className={cn(
          "absolute -bottom-0.5 -end-0.5 inline-flex items-center justify-center rounded-full font-bold leading-none ring-2 ring-background",
          chipSize,
          tierChipClasses(safeLevel),
        )}
      >
        {showChipNumber ? safeLevel : null}
      </span>
    </span>
  );
}

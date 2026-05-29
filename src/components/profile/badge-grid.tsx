import {
  Award,
  Heart,
  MessageCircle,
  Pencil,
  PencilLine,
  Repeat2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

export type BadgeRow = {
  key: string;
  name: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold";
};

const ICONS: Record<string, LucideIcon> = {
  Award,
  Heart,
  MessageCircle,
  Pencil,
  PencilLine,
  Repeat2,
  Sparkles,
};

function tierRing(tier: BadgeRow["tier"]): string {
  switch (tier) {
    case "gold":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/30";
    case "silver":
      return "bg-slate-400/15 text-slate-600 dark:text-slate-300 ring-slate-400/30";
    default:
      return "bg-orange-700/15 text-orange-700 dark:text-orange-400 ring-orange-700/30";
  }
}

export async function BadgeGrid({
  badges,
  emptyLabel,
}: {
  badges: BadgeRow[];
  emptyLabel: string;
}) {
  const t = await getTranslations("badges");

  if (badges.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{emptyLabel}</p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {badges.map((b) => {
        const Icon = ICONS[b.icon] ?? Award;
        // Translate by key, fall back to db row text.
        let displayName = b.name;
        let displayDescription = b.description;
        try {
          displayName = t(`${b.key}.name`);
          displayDescription = t(`${b.key}.description`);
        } catch {
          // fall back silently
        }
        return (
          <li
            key={b.key}
            className="rounded-2xl border border-border/60 bg-card p-3 text-center"
          >
            <div
              className={cn(
                "mx-auto mb-2 flex size-12 items-center justify-center rounded-full ring-2",
                tierRing(b.tier),
              )}
            >
              <Icon className="size-6" />
            </div>
            <p className="text-sm font-semibold leading-tight text-foreground">
              {displayName}
            </p>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              {displayDescription}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

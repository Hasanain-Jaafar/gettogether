import { Crown, Trophy } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { LevelBadge } from "@/components/profile/level-badge";
import { LeveledAvatar } from "@/components/profile/leveled-avatar";
import { cn } from "@/lib/utils";

function initials(name: string | null): string {
  if (!name?.trim()) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

type Row = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  level: number | null;
  xp: number | null;
};

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("leaderboard");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rowsData } = await supabase
    .from("profiles")
    .select("id, name, avatar_url, level, xp")
    .order("xp", { ascending: false })
    .limit(50);
  const rows: Row[] = rowsData ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <Trophy className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center text-muted-foreground">
            {t("empty")}
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="p-2 sm:p-3">
            <ul className="space-y-4">
              {rows.map((row, index) => {
                const isMe = user?.id === row.id;
                const rank = index + 1;
                const isChampion = rank === 1 && (row.xp ?? 0) > 0;
                return (
                  <li key={row.id}>
                    <Link
                      href={`/u/${row.id}`}
                      className={cn(
                        "relative flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/60",
                        isMe && "bg-primary/5 ring-1 ring-primary/30",
                        isChampion &&
                          "overflow-hidden bg-gradient-to-r from-amber-100/80 via-yellow-50 to-amber-100/80 ring-1 ring-amber-400/60 dark:from-amber-950/40 dark:via-amber-900/20 dark:to-amber-950/40",
                      )}
                    >
                      {isChampion && (
                        <span
                          aria-hidden
                          className="animate-shimmer pointer-events-none absolute inset-0"
                        />
                      )}
                      {isChampion ? (
                        <Crown className="animate-bounce-slow size-6 shrink-0 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                      ) : (
                        <span
                          className={cn(
                            "w-6 shrink-0 text-end text-sm font-semibold",
                            rank === 2 && "text-slate-400",
                            rank === 3 && "text-orange-700",
                            rank > 3 && "text-muted-foreground",
                          )}
                        >
                          {rank}
                        </span>
                      )}
                      <div className={cn("relative shrink-0", isChampion && "animate-pulse-slow")}>
                        {isChampion && (
                          <span
                            aria-hidden
                            className="absolute inset-0 rounded-full ring-2 ring-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.55)]"
                          />
                        )}
                        <LeveledAvatar level={row.level ?? 1} className="size-10">
                          <AvatarImage src={row.avatar_url ?? undefined} alt={row.name ?? ""} />
                          <AvatarFallback>{initials(row.name)}</AvatarFallback>
                        </LeveledAvatar>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "flex items-center gap-1 truncate font-semibold text-foreground",
                            isChampion && "text-amber-900 dark:text-amber-200",
                          )}
                        >
                          {row.name ?? "Unnamed"}
                          <LevelBadge level={row.level ?? 1} size="sm" />
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isChampion ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground",
                        )}
                      >
                        {(row.xp ?? 0).toLocaleString(locale)} {t("xpSuffix")}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

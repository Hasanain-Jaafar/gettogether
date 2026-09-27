import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CATEGORY_SOLID, POST_CATEGORIES, type PostCategory } from "@/lib/post-categories";
import { cn } from "@/lib/utils";
import { LinkPendingSpinner } from "@/components/ui/link-pending-spinner";

export async function CategoryFilterBar({ active }: { active: PostCategory | null }) {
  const t = await getTranslations("feed");

  return (
    <div className="sticky top-0 z-10 -mx-4 bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60 md:-mx-6 md:px-6">
      <div className="relative">
        <div className="flex gap-1.5 overflow-x-auto scroll-px-4 snap-x snap-mandatory scrollbar-hide py-1.5">
          <Link
            href="/dashboard"
            className={cn(
              "flex shrink-0 snap-start items-center rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap transition-all",
              active === null
                ? "bg-foreground text-background shadow-md shadow-foreground/20"
                : "border border-border/40 bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground",
            )}
          >
            {t("all")}
            <LinkPendingSpinner />
          </Link>
          {POST_CATEGORIES.map((c) => {
            const selected = active === c;
            return (
              <Link
                key={c}
                href={`/dashboard?category=${c}`}
                className={cn(
                  "flex shrink-0 snap-start items-center rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap transition-all",
                  selected
                    ? CATEGORY_SOLID[c]
                    : "border border-border/40 bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                {t(`categories.${c}`)}
                <LinkPendingSpinner />
              </Link>
            );
          })}
          {/* trailing spacer so the last chip clears the fade overlay and the screen edge */}
          <div className="shrink-0 w-3" aria-hidden />
        </div>
        <div className="pointer-events-none absolute inset-y-0 w-10 ltr:right-0 ltr:bg-gradient-to-l rtl:left-0 rtl:bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 w-10 ltr:left-0 ltr:bg-gradient-to-r rtl:right-0 rtl:bg-gradient-to-l from-background to-transparent" />
      </div>
    </div>
  );
}

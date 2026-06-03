"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Heart, Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MarketingHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("marketing.header");
  const tLang = useTranslations("language");
  const onHome = pathname === "/";

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onHome) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  function switchLocale(next: "en" | "ar") {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          onClick={handleLogoClick}
          className="flex items-center gap-2 text-lg font-semibold tracking-tight hover:opacity-80 transition-opacity"
        >
          <Heart className="size-5 text-primary fill-primary/20" />
          <span>GetTogether</span>
        </Link>

        <nav className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label={tLang("label")}>
                <Languages className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => switchLocale("en")}>
                {tLang("english")}
                {locale === "en" && <span className="ms-auto text-primary">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchLocale("ar")}>
                {tLang("arabic")}
                {locale === "ar" && <span className="ms-auto text-primary">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

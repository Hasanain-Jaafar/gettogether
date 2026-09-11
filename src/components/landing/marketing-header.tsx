"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Heart } from "lucide-react";

export function MarketingHeader() {
  const pathname = usePathname();
  const onHome = pathname === "/";

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onHome) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

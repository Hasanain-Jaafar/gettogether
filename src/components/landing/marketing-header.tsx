import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Heart } from "lucide-react";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
      <Link
        href="/"
        className="flex items-center gap-2 text-lg font-semibold tracking-tight hover:opacity-80 transition-opacity"
      >
        <Heart className="size-5 text-primary fill-primary/20" />
        <span>GetTogether</span>
      </Link>
      <nav className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" asChild className="hidden sm:flex">
          <Link href="/sign-in">Sign in</Link>
        </Button>
        <Button asChild className="rounded-full">
          <Link href="/sign-up">Get started</Link>
        </Button>
      </nav>
    </header>
  );
}

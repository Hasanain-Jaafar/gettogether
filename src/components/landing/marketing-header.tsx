import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Heart } from "lucide-react";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#about", label: "About" },
  { href: "#faq", label: "FAQ" },
];

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 text-lg font-semibold tracking-tight hover:opacity-80 transition-opacity"
      >
        <Heart className="size-5 text-primary fill-primary/20" />
        <span className="hidden sm:inline">GetTogether</span>
        <span className="sm:hidden">GetTogether</span>
      </Link>

      {/* Navigation links - desktop */}
      <nav className="hidden md:flex items-center gap-6">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Right side: theme toggle + buttons */}
      <nav className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" asChild className="hidden sm:flex rounded-full">
          <Link href="/sign-in">Sign in</Link>
        </Button>
        <Button asChild className="rounded-full shadow-lg shadow-primary/20">
          <Link href="/sign-up">Get started</Link>
        </Button>
      </nav>
    </header>
  );
}

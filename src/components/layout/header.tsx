"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Home, User, LogOut, Menu } from "lucide-react";

function getInitials(name: string | null, email: string | undefined): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}

type HeaderProps = {
  user: {
    id: string;
    email?: string;
    user_metadata?: { name?: string; full_name?: string };
  } | null;
  profile?: { name?: string | null; avatar_url?: string | null } | null;
};

export function Header({ user, profile }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const name =
    profile?.name ??
    user?.user_metadata?.name ??
    user?.user_metadata?.full_name ??
    null;
  const initials = getInitials(name, user?.email);
  const avatarUrl = profile?.avatar_url ?? null;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  if (!user) return null;

  return (
    <>
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden rounded-lg"
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu className="size-5" />
          <span className="sr-only">Open menu</span>
        </Button>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/dashboard"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname === "/dashboard"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <Home className="size-4 shrink-0" />
            Feed
          </Link>
          <Link
            href="/profile"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname === "/profile"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <User className="size-4 shrink-0" />
            Profile
          </Link>
        </nav>

        {/* Right side: theme toggle + avatar */}
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative size-9 rounded-full hover:bg-accent">
                <Avatar className="size-9">
                  <AvatarImage
                    src={avatarUrl ?? undefined}
                    alt={name ?? "User"}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2">
                  <User className="size-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile navigation */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        onLogout={handleLogout}
      />
    </>
  );
}

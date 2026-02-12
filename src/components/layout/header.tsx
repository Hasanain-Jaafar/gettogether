"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Home, User, LogOut, Menu, Bell, MessageSquare, Search } from "lucide-react";

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

const mainNavItems = [
  { href: "/dashboard", label: "Feed", icon: Home },
  { href: "/profile", label: "Profile", icon: User },
];

const secondaryNavItems = [
  { href: "/explore", label: "Explore", icon: Search },
  { href: "/messages", label: "Messages", icon: MessageSquare },
];

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
    router.push("/");
    router.refresh();
  }

  if (!user) return null;

  return (
    <>
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-2 sm:px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
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

        {/* Main navigation - desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Secondary navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.href}
                variant="ghost"
                size="icon"
                asChild
                className="rounded-lg"
              >
                <Link href={item.href}>
                  <Icon className="size-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </Button>
            );
          })}

          {/* Notifications with badge */}
          <Button variant="ghost" size="icon" className="rounded-lg relative">
            <Link href="/notifications">
              <Bell className="size-5" />
              <span className="sr-only">Notifications</span>
            </Link>
            <Badge className="absolute -top-0.5 -right-0.5 size-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground">
              3
            </Badge>
          </Button>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative size-9 rounded-full hover:bg-accent">
                <Avatar className="size-9">
                  <AvatarImage src={avatarUrl ?? undefined} alt={name ?? "User"} />
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
              <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-destructive">
                <LogOut className="size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
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

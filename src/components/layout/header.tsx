"use client";

import { useState, useEffect } from "react";
import { useRouter as useNextRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
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
import { startNavigationProgress } from "@/components/navigation-progress";
import { Home, User, UserCircle, LogOut, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const nextRouter = useNextRouter();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("nav");
  const [unreadCount, setUnreadCount] = useState(0);

  const mainNavItems = [
    { href: "/dashboard", label: t("feed"), icon: Home },
    { href: "/profile", label: t("profile"), icon: User },
  ];

  // The Home icon replaces the old mobile menu; desktop already shows it as a text link above.
  const secondaryNavItems = [
    { href: "/dashboard", label: t("feed"), icon: Home, mobileOnly: true },
  ];

  const name =
    profile?.name ??
    user?.user_metadata?.name ??
    user?.user_metadata?.full_name ??
    null;
  const initials = getInitials(name, user?.email);
  const avatarUrl = profile?.avatar_url ?? null;
  const userId = user?.id ?? "";

  // Fetch unread notification count
  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    async function fetchUnreadCount() {
      const client = createClient();
      const { count } = await client
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false);

      setUnreadCount(count ?? 0);
    }

    fetchUnreadCount();

    // Subscribe to new notifications
    const client = createClient();
    const channel = client
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new.read === false) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const wasUnread = payload.old?.read === false;
          const isNowRead = payload.new?.read === true;
          if (wasUnread && isNowRead) {
            setUnreadCount((prev) => Math.max(prev - 1, 0));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  async function handleLogout() {
    startNavigationProgress();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    nextRouter.refresh();
  }

  if (!user) return null;

  return (
    <header className="sticky top-0 z-10 h-14 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      {/* Same width and side padding as the page content, so the icons line up with the posts */}
      <div className="mx-auto flex h-full w-full max-w-4xl items-center gap-4 px-4 md:px-6 lg:max-w-6xl">
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

        {/* Spacer (desktop only; on mobile the icon row fills the width) */}
        <div className="hidden flex-1 md:block" />

        {/* Secondary navigation: spread evenly across the bar on mobile.
            RTL order: notifications (right), home (center), avatar (left). */}
        <nav className="flex flex-1 items-center justify-between md:flex-none md:justify-end md:gap-2">
          {/* Notifications with badge */}
          <Button
            variant="ghost"
            size="icon"
            asChild
            className={cn("rounded-lg relative", pathname === "/notifications" && "bg-accent text-primary")}
          >
            <Link href="/notifications" aria-label={t("notifications")}>
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 size-5 flex items-center justify-center p-0 text-[10px] bg-primary text-primary-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </Link>
          </Button>

          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.href}
                variant="ghost"
                size="icon"
                asChild
                className={cn(
                  "rounded-lg",
                  item.mobileOnly && "md:hidden",
                  pathname === item.href && "bg-accent text-primary"
                )}
              >
                <Link href={item.href}>
                  <Icon className="size-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </Button>
            );
          })}

          {/* Avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative size-9 rounded-full hover:bg-accent p-0">
                <Avatar className="size-9">
                  <AvatarImage src={avatarUrl ?? undefined} alt={name ?? "User"} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href={`/u/${userId}`} className="flex items-center gap-2">
                  <UserCircle className="size-4" />
                  {t("viewProfile")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2">
                  <User className="size-4" />
                  {t("editProfile")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-destructive">
                <LogOut className="size-4" />
                {t("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}

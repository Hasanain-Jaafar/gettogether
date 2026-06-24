"use client";

import { useState, useEffect } from "react";
import { useRouter as useNextRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LeveledAvatar } from "@/components/profile/leveled-avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Home, User, UserCircle, LogOut, Menu, Bell, Languages, Trophy, Calendar } from "lucide-react";

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
  profile?: { name?: string | null; avatar_url?: string | null; level?: number | null } | null;
};

export function Header({ user, profile }: HeaderProps) {
  const nextRouter = useNextRouter();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tLang = useTranslations("language");
  const locale = useLocale();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  function switchLocale(next: "en" | "ar") {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  const mainNavItems = [
    { href: "/dashboard", label: t("feed"), icon: Home },
    { href: "/calendar", label: t("calendar"), icon: Calendar },
    { href: "/profile", label: t("profile"), icon: User },
  ];

  const secondaryNavItems = [
    { href: "/leaderboard", label: t("leaderboard"), icon: Trophy },
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
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    nextRouter.refresh();
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
          <span className="sr-only">{t("openMenu")}</span>
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
          <Button variant="ghost" size="icon" asChild className="rounded-lg relative">
            <Link href="/notifications" aria-label={t("notifications")}>
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 size-5 flex items-center justify-center p-0 text-[10px] bg-primary text-primary-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </Link>
          </Button>

          {/* Language switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-lg" aria-label={tLang("label")}>
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

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative size-9 rounded-full hover:bg-accent p-0">
                <LeveledAvatar level={profile?.level ?? 1} className="size-9">
                  <AvatarImage src={avatarUrl ?? undefined} alt={name ?? "User"} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </LeveledAvatar>
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
      </header>

      {/* Mobile navigation */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        onLogout={handleLogout}
        unreadCount={unreadCount}
      />
    </>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Home, User, UserCircle, X, Search, MessageSquare, Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type MobileNavProps = {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  userId?: string;
  unreadCount?: number;
};

export function MobileNav({ isOpen, onClose, onLogout, userId, unreadCount = 0 }: MobileNavProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: t("feed"), icon: Home },
    { href: "/explore", label: t("explore"), icon: Search },
    { href: "/messages", label: t("messages"), icon: MessageSquare },
    { href: "/notifications", label: t("notifications"), icon: Bell },
    ...(userId
      ? [{ href: `/u/${userId}`, label: t("viewProfile"), icon: UserCircle }]
      : []),
    { href: "/profile", label: t("editProfile"), icon: User },
  ];

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 transition-opacity md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          "fixed inset-y-0 start-0 z-50 w-72 transform bg-card border-e shadow-xl transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "rtl:translate-x-full ltr:-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <span className="text-lg font-semibold">{t("menu")}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
            aria-label={t("closeMenu")}
          >
            <X className="size-5" />
            <span className="sr-only">{t("closeMenu")}</span>
          </Button>
        </div>

        <nav className="flex flex-col p-4 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-lg font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.href === "/notifications" && unreadCount > 0 && (
                  <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 h-5">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </Link>
            );
          })}
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-lg font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-4 shrink-0" />
            {t("logout")}
          </button>
        </nav>
      </div>
    </>
  );
}

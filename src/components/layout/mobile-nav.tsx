"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type MobileNavProps = {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
};

const navItems = [
  { href: "/dashboard", label: "Feed", icon: Home },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileNav({ isOpen, onClose, onLogout }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 transition-opacity md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      {/* Slide-out menu */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform bg-card border-r shadow-xl transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <span className="text-lg font-semibold">Menu</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="size-5" />
            <span className="sr-only">Close menu</span>
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
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="size-4 shrink-0" />
            Log out
          </button>
        </nav>
      </div>
    </>
  );
}

"use client";

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
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
      <nav className="flex items-center gap-1 sm:gap-2">
        <Link
          href="/dashboard"
          className={`rounded-md px-2 py-1.5 text-sm font-medium sm:px-3 ${
            pathname === "/dashboard"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          Feed
        </Link>
        <Link
          href="/profile"
          className={`rounded-md px-2 py-1.5 text-sm font-medium sm:px-3 ${
            pathname === "/profile"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          Profile
        </Link>
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative size-9 rounded-full">
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
              <Link href="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

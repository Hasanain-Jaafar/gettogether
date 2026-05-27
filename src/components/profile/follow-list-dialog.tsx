"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type FollowRelation = {
  id: string;
  name: string | null;
  avatar_url: string | null;
};

type FollowListDialogProps = {
  label: string;
  users: FollowRelation[];
};

function getInitials(name: string | null) {
  if (!name?.trim()) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function FollowListDialog({ label, users }: FollowListDialogProps) {
  const t = useTranslations("feed.post");
  const [open, setOpen] = useState(false);
  const count = users.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-3 rounded-xl px-2 py-1 -mx-2 hover:bg-accent transition-colors text-start"
        >
          <Users className="size-5 text-primary" />
          <div>
            <p className="text-lg font-semibold text-foreground">{count}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {label} · {count}
          </DialogTitle>
        </DialogHeader>
        {count === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">—</p>
        ) : (
          <ul className="max-h-80 space-y-1 overflow-y-auto">
            {users.map((u) => (
              <li key={u.id}>
                <Link
                  href={`/u/${u.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl p-2 hover:bg-accent transition-colors"
                >
                  <Avatar className="size-10">
                    <AvatarImage src={u.avatar_url ?? undefined} alt={u.name ?? ""} />
                    <AvatarFallback className="text-xs">
                      {getInitials(u.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate font-medium">
                    {u.name ?? t("someone")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { PenSquare, Search } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getOrCreateConversation,
  listMessageableUsers,
  type MessageableUser,
} from "@/app/[locale]/(dashboard)/actions/messages";

function initials(name: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function NewMessageDialog() {
  const t = useTranslations("messages");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<MessageableUser[]>([]);
  const [query, setQuery] = useState("");
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    listMessageableUsers().then((users) => {
      if (cancelled) return;
      setPeople(users);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) => (p.name ?? "").toLowerCase().includes(q));
  }, [people, query]);

  async function startWith(userId: string) {
    if (starting) return;
    setStarting(userId);
    const result = await getOrCreateConversation(userId);
    setStarting(null);
    if (!result.success) {
      const msg = /can only message/i.test(result.error)
        ? t("followGateError")
        : result.error;
      toast.error(msg);
      return;
    }
    setOpen(false);
    router.push(`/messages/${result.conversationId}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full text-lg" size="sm">
          <PenSquare className="size-4 me-1.5" />
          {t("newMessage")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("newMessage")}</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPeople")}
            className="ps-9"
          />
        </div>
        <div className="max-h-72 overflow-y-auto -mx-2">
          {loading ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              …
            </p>
          ) : people.length === 0 ? (
            <div className="px-2 py-6 text-center space-y-2">
              <p className="text-sm font-medium text-foreground">
                {t("followFirstTitle")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("followFirstHint")}
              </p>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="rounded-full mt-2"
                onClick={() => setOpen(false)}
              >
                <Link href="/explore">{t("goToExplore")}</Link>
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              {t("noMatches")}
            </p>
          ) : (
            <ul className="space-y-1">
              {filtered.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => startWith(p.id)}
                    disabled={starting === p.id}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2 hover:bg-accent transition-colors text-start disabled:opacity-50"
                  >
                    <Avatar className="size-9 shrink-0">
                      <AvatarImage src={p.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {initials(p.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground truncate">
                      {p.name ?? "—"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

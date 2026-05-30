"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Calendar, MapPin, Pencil, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { deleteEvent, type CalendarEvent } from "@/app/[locale]/(dashboard)/actions/events";
import { EventForm } from "./event-form";

type Props = {
  event: CalendarEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  onUpdated: (ev: CalendarEvent) => void;
  onDeleted: (id: string) => void;
};

export function EventDetailDialog({
  event,
  open,
  onOpenChange,
  currentUserId,
  onUpdated,
  onDeleted,
}: Props) {
  const t = useTranslations("calendar");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);

  const isOwner = event.user_id === currentUserId;

  const start = new Date(event.starts_at);
  const end = event.ends_at ? new Date(event.ends_at) : null;
  const dateFmt = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" });

  const author = event.author;
  const initials =
    author?.name
      ?.trim()
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "U";

  function handleDelete() {
    if (!confirm(t("confirmDelete"))) return;
    startTransition(async () => {
      const result = await deleteEvent(event.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t("eventDeleted"));
      onDeleted(event.id);
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{event.title}</DialogTitle>
            <DialogDescription>
              {t(`visibility.${event.visibility}`)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            {author && (
              <Link
                href={`/u/${author.id}`}
                className="flex items-center gap-2 rounded-lg p-2 -m-2 hover:bg-accent"
              >
                <Avatar className="size-8">
                  <AvatarImage src={author.avatar_url ?? undefined} alt={author.name ?? ""} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{author.name ?? t("unknownUser")}</span>
              </Link>
            )}

            <div className="flex items-start gap-2">
              <Calendar className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div>
                <div>{dateFmt.format(start)}</div>
                <div className="text-muted-foreground">
                  {timeFmt.format(start)}
                  {end ? ` – ${timeFmt.format(end)}` : ""}
                </div>
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-2">
                <MapPin className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                <span className="break-words">{event.location}</span>
              </div>
            )}

            {event.description && (
              <p className="whitespace-pre-wrap text-muted-foreground">{event.description}</p>
            )}
          </div>

          {isOwner && (
            <DialogFooter>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditOpen(true)}
                disabled={pending}
              >
                <Pencil className="size-4" />
                {t("editEvent")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={pending}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" />
                {t("deleteEvent")}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {isOwner && (
        <EventForm
          open={editOpen}
          onOpenChange={setEditOpen}
          editing={event}
          onUpdated={(ev) => {
            setEditOpen(false);
            onUpdated(ev);
          }}
        />
      )}
    </>
  );
}

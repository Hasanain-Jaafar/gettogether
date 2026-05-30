"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createEvent,
  updateEvent,
  type CalendarEvent,
} from "@/app/[locale]/(dashboard)/actions/events";
import type { EventVisibility } from "@/lib/validations/event";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date | null;
  editing?: CalendarEvent | null;
  onCreated?: (ev: CalendarEvent) => void;
  onUpdated?: (ev: CalendarEvent) => void;
};

function toLocalInputValue(d: Date): string {
  // Format Date as `YYYY-MM-DDTHH:mm` in local time for <input type=datetime-local>.
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function defaultStart(initialDate?: Date | null): string {
  const base = initialDate ? new Date(initialDate) : new Date();
  // If a date was clicked, default to 7pm; otherwise the next hour.
  if (initialDate) {
    base.setHours(19, 0, 0, 0);
  } else {
    base.setMinutes(0, 0, 0);
    base.setHours(base.getHours() + 1);
  }
  return toLocalInputValue(base);
}

export function EventForm(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      {props.open && <EventFormInner {...props} />}
    </Dialog>
  );
}

function EventFormInner({
  onOpenChange,
  initialDate,
  editing,
  onCreated,
  onUpdated,
}: Props) {
  const t = useTranslations("calendar");
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [location, setLocation] = useState(editing?.location ?? "");
  const [startsAt, setStartsAt] = useState(
    editing ? toLocalInputValue(new Date(editing.starts_at)) : defaultStart(initialDate),
  );
  const [endsAt, setEndsAt] = useState(
    editing?.ends_at ? toLocalInputValue(new Date(editing.ends_at)) : "",
  );
  const [visibility, setVisibility] = useState<EventVisibility>(editing?.visibility ?? "followers");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title,
      description: description || null,
      location: location || null,
      starts_at: startsAt,
      ends_at: endsAt || null,
      visibility,
    };
    startTransition(async () => {
      const result = editing
        ? await updateEvent(editing.id, payload)
        : await createEvent(payload);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(editing ? t("eventUpdated") : t("eventCreated"));
      if (editing) {
        onUpdated?.(result.event);
      } else {
        onCreated?.(result.event);
      }
      onOpenChange(false);
    });
  }

  return (
    <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? t("editEvent") : t("createEvent")}</DialogTitle>
          <DialogDescription>{t("formDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="event-title">{t("titleLabel")}</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              required
              placeholder={t("titlePlaceholder")}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="event-starts">{t("startsAt")}</Label>
              <Input
                id="event-starts"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-ends">{t("endsAt")}</Label>
              <Input
                id="event-ends"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="event-location">{t("locationLabel")}</Label>
            <Input
              id="event-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={300}
              placeholder={t("locationPlaceholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="event-description">{t("descriptionLabel")}</Label>
            <Textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder={t("descriptionPlaceholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("visibilityLabel")}</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["followers", "public", "private"] as EventVisibility[]).map((v) => (
                <label
                  key={v}
                  className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm transition-colors ${
                    visibility === v
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:bg-accent"
                  }`}
                >
                  <input
                    type="radio"
                    name="event-visibility"
                    value={v}
                    checked={visibility === v}
                    onChange={() => setVisibility(v)}
                    className="sr-only"
                  />
                  {t(`visibility.${v}`)}
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={pending || !title.trim()}>
              {pending ? t("saving") : editing ? t("save") : t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, CalendarDays, Globe, Lock, MapPin, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventForm } from "./event-form";
import { EventDetailDialog } from "./event-detail-dialog";
import type { CalendarEvent } from "@/app/[locale]/(dashboard)/actions/events";

type Props = {
  currentUserId: string;
  initialEvents: CalendarEvent[];
};

const PALETTE = [
  "bg-sky-100 dark:bg-sky-950/40",
  "bg-orange-100 dark:bg-orange-950/40",
  "bg-violet-100 dark:bg-violet-950/40",
  "bg-emerald-100 dark:bg-emerald-950/40",
];

const CHIP_PALETTE = [
  "bg-sky-200/70 text-sky-900 dark:bg-sky-900/60 dark:text-sky-100",
  "bg-orange-200/70 text-orange-900 dark:bg-orange-900/60 dark:text-orange-100",
  "bg-violet-200/70 text-violet-900 dark:bg-violet-900/60 dark:text-violet-100",
  "bg-emerald-200/70 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100",
];

export function EventsCardList({ currentUserId, initialEvents }: Props) {
  const t = useTranslations("calendar");
  const locale = useLocale();
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: "short", month: "short", day: "numeric" }),
    [locale],
  );
  const timeFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }),
    [locale],
  );

  function handleCreated(ev: CalendarEvent) {
    setEvents((prev) => [...prev, ev].sort((a, b) => a.starts_at.localeCompare(b.starts_at)));
  }
  function handleUpdated(ev: CalendarEvent) {
    setEvents((prev) =>
      prev
        .map((e) => (e.id === ev.id ? ev : e))
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
    );
    setSelectedEvent(ev);
  }
  function handleDeleted(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setSelectedEvent(null);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{t("upcomingEvents")}</h1>
          <p className="text-sm text-muted-foreground">{t("upcomingSubtitle")}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="rounded-full">
          <Plus className="size-4" />
          <span className="hidden sm:inline">{t("createEvent")}</span>
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <CalendarDays className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 font-medium">{t("emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("emptyDescription")}</p>
          <Button className="mt-4 rounded-full" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            {t("createEvent")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((ev, i) => {
            const bg = PALETTE[i % PALETTE.length];
            const chip = CHIP_PALETTE[i % CHIP_PALETTE.length];
            const start = new Date(ev.starts_at);
            const end = ev.ends_at ? new Date(ev.ends_at) : null;
            const VisIcon =
              ev.visibility === "public" ? Globe : ev.visibility === "private" ? Lock : Users;
            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => setSelectedEvent(ev)}
                className={`group flex min-h-[230px] flex-col rounded-2xl p-5 text-start shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${bg}`}
              >
                <h2 className="text-xl font-bold text-foreground line-clamp-2">{ev.title}</h2>
                {ev.description && (
                  <p className="mt-1.5 text-sm text-foreground/70 line-clamp-2">{ev.description}</p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${chip}`}>
                    <CalendarDays className="size-3" />
                    {dateFmt.format(start)} · {timeFmt.format(start)}
                    {end ? ` – ${timeFmt.format(end)}` : ""}
                  </span>
                  {ev.location && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${chip}`}>
                      <MapPin className="size-3" />
                      <span className="max-w-[140px] truncate">{ev.location}</span>
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${chip}`}>
                    <VisIcon className="size-3" />
                    {t(`visibility.${ev.visibility}`)}
                  </span>
                </div>

                <div className="mt-auto flex items-center justify-between pt-5">
                  <span className="text-sm font-semibold text-foreground">
                    {ev.author?.name ?? t("unknownUser")}
                  </span>
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm transition group-hover:bg-background">
                    <ArrowRight className="size-4 rtl:rotate-180" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <EventForm open={createOpen} onOpenChange={setCreateOpen} onCreated={handleCreated} />

      {selectedEvent && (
        <EventDetailDialog
          event={selectedEvent}
          open={!!selectedEvent}
          onOpenChange={(o) => !o && setSelectedEvent(null)}
          currentUserId={currentUserId}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}

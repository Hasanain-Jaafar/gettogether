"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Archive, ArrowRight, CalendarDays, Globe, Lock, MapPin, Plus, Users } from "lucide-react";
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

const PAST_BG = "bg-muted/60 dark:bg-muted/30";
const PAST_CHIP = "bg-background/70 text-muted-foreground dark:bg-background/40";

function isPast(ev: CalendarEvent, now: number) {
  const end = ev.ends_at ? new Date(ev.ends_at).getTime() : new Date(ev.starts_at).getTime();
  return end < now;
}

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

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const up: CalendarEvent[] = [];
    const pa: CalendarEvent[] = [];
    for (const ev of events) {
      if (isPast(ev, now)) pa.push(ev);
      else up.push(ev);
    }
    up.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    pa.sort((a, b) => b.starts_at.localeCompare(a.starts_at));
    return { upcoming: up, past: pa };
  }, [events]);

  function handleCreated(ev: CalendarEvent) {
    setEvents((prev) => [...prev, ev]);
  }
  function handleUpdated(ev: CalendarEvent) {
    setEvents((prev) => prev.map((e) => (e.id === ev.id ? ev : e)));
    setSelectedEvent(ev);
  }
  function handleDeleted(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setSelectedEvent(null);
  }

  function renderCard(ev: CalendarEvent, i: number, archived: boolean) {
    const bg = archived ? PAST_BG : PALETTE[i % PALETTE.length];
    const chip = archived ? PAST_CHIP : CHIP_PALETTE[i % CHIP_PALETTE.length];
    const start = new Date(ev.starts_at);
    const end = ev.ends_at ? new Date(ev.ends_at) : null;
    const VisIcon =
      ev.visibility === "public" ? Globe : ev.visibility === "private" ? Lock : Users;
    return (
      <button
        key={ev.id}
        type="button"
        onClick={() => setSelectedEvent(ev)}
        className={`group flex min-h-[230px] flex-col rounded-2xl p-5 text-start shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${bg} ${
          archived ? "opacity-80 saturate-50 hover:opacity-100" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <h2
            className={`text-xl font-bold line-clamp-2 ${
              archived ? "text-muted-foreground" : "text-foreground"
            }`}
          >
            {ev.title}
          </h2>
          {archived && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Archive className="size-3" />
              {t("archived")}
            </span>
          )}
        </div>
        {ev.description && (
          <p
            className={`mt-1.5 text-sm line-clamp-2 ${
              archived ? "text-muted-foreground/80" : "text-foreground/70"
            }`}
          >
            {ev.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${chip}`}
          >
            <CalendarDays className="size-3" />
            {dateFmt.format(start)} · {timeFmt.format(start)}
            {end ? ` – ${timeFmt.format(end)}` : ""}
          </span>
          {ev.location && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${chip}`}
            >
              <MapPin className="size-3" />
              <span className="max-w-[140px] truncate">{ev.location}</span>
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${chip}`}
          >
            <VisIcon className="size-3" />
            {t(`visibility.${ev.visibility}`)}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between pt-5">
          <span
            className={`text-sm font-semibold ${
              archived ? "text-muted-foreground" : "text-foreground"
            }`}
          >
            {ev.author?.name ?? t("unknownUser")}
          </span>
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm transition group-hover:bg-background">
            <ArrowRight className="size-4 rtl:rotate-180" />
          </span>
        </div>
      </button>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{t("upcomingEvents")}</h1>
          <p className="text-sm text-muted-foreground">{t("upcomingSubtitle")}</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="size-9 rounded-full p-0 sm:h-9 sm:w-auto sm:px-4"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">{t("createEvent")}</span>
        </Button>
      </div>

      {upcoming.length === 0 ? (
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
          {upcoming.map((ev, i) => renderCard(ev, i, false))}
        </div>
      )}

      {past.length > 0 && (
        <section className="mt-12">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Archive className="size-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-muted-foreground">{t("pastEvents")}</h2>
            </div>
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">{past.length}</span>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">{t("pastSubtitle")}</p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {past.map((ev, i) => renderCard(ev, i, true))}
          </div>
        </section>
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

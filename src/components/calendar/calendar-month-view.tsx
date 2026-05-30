"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EventForm } from "./event-form";
import { EventDetailDialog } from "./event-detail-dialog";
import type { CalendarEvent } from "@/app/[locale]/(dashboard)/actions/events";
import { getEventsInRange } from "@/app/[locale]/(dashboard)/actions/events";

type Props = {
  currentUserId: string;
  initialEvents: CalendarEvent[];
  initialYear: number;
  initialMonth: number; // 0-indexed
};

function startOfMonthGrid(year: number, month: number): Date {
  const first = new Date(year, month, 1);
  // Monday as first day of week. JS getDay: Sun=0..Sat=6 → shift so Mon=0.
  const offset = (first.getDay() + 6) % 7;
  return new Date(year, month, 1 - offset);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function CalendarMonthView({
  currentUserId,
  initialEvents,
  initialYear,
  initialMonth,
}: Props) {
  const t = useTranslations("calendar");
  const locale = useLocale();
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [createInitialDate, setCreateInitialDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const today = useMemo(() => new Date(), []);

  const gridStart = useMemo(() => startOfMonthGrid(year, month), [year, month]);
  const days = useMemo(
    () => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)),
    [gridStart],
  );

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
        new Date(year, month, 1),
      ),
    [locale, year, month],
  );

  const weekdayLabels = useMemo(() => {
    // Monday-first short weekday labels in the active locale.
    const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
    const monday = new Date(2024, 0, 1); // Jan 1 2024 is a Monday.
    return Array.from({ length: 7 }, (_, i) => fmt.format(addDays(monday, i)));
  }, [locale]);

  const timeFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }),
    [locale],
  );

  const tzLabel = useMemo(() => {
    try {
      const parts = new Intl.DateTimeFormat(locale, { timeZoneName: "short" }).formatToParts(today);
      return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    } catch {
      return "";
    }
  }, [locale, today]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const d = new Date(ev.starts_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const list = map.get(key) ?? [];
      list.push(ev);
      map.set(key, list);
    }
    return map;
  }, [events]);

  function reloadRange(nextYear: number, nextMonth: number) {
    const rangeStart = startOfMonthGrid(nextYear, nextMonth);
    const rangeEnd = addDays(rangeStart, 42);
    startTransition(async () => {
      const fresh = await getEventsInRange(rangeStart, rangeEnd);
      setEvents(fresh);
    });
  }

  function goPrev() {
    const nm = month === 0 ? 11 : month - 1;
    const ny = month === 0 ? year - 1 : year;
    setMonth(nm);
    setYear(ny);
    reloadRange(ny, nm);
  }
  function goNext() {
    const nm = month === 11 ? 0 : month + 1;
    const ny = month === 11 ? year + 1 : year;
    setMonth(nm);
    setYear(ny);
    reloadRange(ny, nm);
  }
  function goToday() {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    reloadRange(now.getFullYear(), now.getMonth());
  }

  function handleDayClick(d: Date) {
    setCreateInitialDate(d);
    setCreateOpen(true);
  }

  function handleEventCreated(ev: CalendarEvent) {
    setEvents((prev) => [...prev, ev].sort((a, b) => a.starts_at.localeCompare(b.starts_at)));
  }
  function handleEventUpdated(ev: CalendarEvent) {
    setEvents((prev) =>
      prev.map((e) => (e.id === ev.id ? ev : e)).sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
    );
    setSelectedEvent(ev);
  }
  function handleEventDeleted(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setSelectedEvent(null);
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday} className="rounded-full">
            {t("today")}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goPrev}
            aria-label={t("previousMonth")}
            className="rounded-full"
          >
            <ChevronLeft className="size-5 rtl:rotate-180" />
          </Button>
          <div className="text-center">
            <div className="font-semibold capitalize">{monthLabel}</div>
            {tzLabel && (
              <div className="text-xs text-muted-foreground">
                {timeFmt.format(today)} {tzLabel}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={goNext}
            aria-label={t("nextMonth")}
            className="rounded-full"
          >
            <ChevronRight className="size-5 rtl:rotate-180" />
          </Button>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setCreateInitialDate(null);
            setCreateOpen(true);
          }}
          className="rounded-full"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">{t("createEvent")}</span>
        </Button>
      </div>

      <div className="grid grid-cols-7 border-b bg-muted/30 text-xs font-medium text-muted-foreground">
        {weekdayLabels.map((w) => (
          <div key={w} className="px-2 py-2 text-center uppercase tracking-wide">
            {w}
          </div>
        ))}
      </div>

      <div
        className={`grid grid-cols-7 ${pending ? "opacity-70" : ""}`}
        aria-busy={pending}
      >
        {days.map((d, i) => {
          const inMonth = d.getMonth() === month;
          const isToday = isSameDay(d, today);
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          const dayEvents = eventsByDay.get(key) ?? [];
          const visible = dayEvents.slice(0, 2);
          const overflow = dayEvents.length - visible.length;
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleDayClick(d)}
              className={`min-h-[88px] sm:min-h-[110px] border-b border-e p-1.5 text-start transition-colors hover:bg-accent/40 ${
                inMonth ? "" : "bg-muted/20 text-muted-foreground"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex size-6 items-center justify-center rounded-full text-xs ${
                    isToday ? "bg-primary text-primary-foreground font-semibold" : ""
                  }`}
                >
                  {d.getDate()}
                </span>
              </div>
              <div className="mt-1 space-y-1">
                {visible.map((ev) => (
                  <span
                    key={ev.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(ev);
                    }}
                    className="block truncate rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary hover:bg-primary/20"
                  >
                    <span className="font-medium">
                      {timeFmt.format(new Date(ev.starts_at))}
                    </span>
                    {" · "}
                    {ev.title}
                  </span>
                ))}
                {overflow > 0 && (
                  <span className="block px-1 text-[11px] text-muted-foreground">
                    +{overflow} {t("more")}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <EventForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        initialDate={createInitialDate}
        onCreated={handleEventCreated}
      />

      {selectedEvent && (
        <EventDetailDialog
          event={selectedEvent}
          open={!!selectedEvent}
          onOpenChange={(o) => !o && setSelectedEvent(null)}
          currentUserId={currentUserId}
          onUpdated={handleEventUpdated}
          onDeleted={handleEventDeleted}
        />
      )}
    </Card>
  );
}

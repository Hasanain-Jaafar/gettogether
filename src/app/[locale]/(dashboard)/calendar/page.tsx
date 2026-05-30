import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getEventsInRange } from "@/app/[locale]/(dashboard)/actions/events";
import { CalendarMonthView } from "@/components/calendar/calendar-month-view";

function startOfMonthGrid(year: number, month: number): Date {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Monday-first
  return new Date(year, month, 1 - offset);
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const rangeStart = startOfMonthGrid(year, month);
  const rangeEnd = addDays(rangeStart, 42);

  const initialEvents = await getEventsInRange(rangeStart, rangeEnd);

  return (
    <div className="mx-auto max-w-6xl">
      <CalendarMonthView
        currentUserId={user.id}
        initialEvents={initialEvents}
        initialYear={year}
        initialMonth={month}
      />
    </div>
  );
}

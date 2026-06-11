import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getEventsInRange } from "@/app/[locale]/(dashboard)/actions/events";
import { EventsCardList } from "@/components/calendar/events-card-list";

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
  // Include past events (last ~6 months) so they can be shown as archived,
  // alongside upcoming events for the next ~6 months.
  const rangeStart = new Date(now);
  rangeStart.setMonth(rangeStart.getMonth() - 6);
  const rangeEnd = new Date(now);
  rangeEnd.setMonth(rangeEnd.getMonth() + 6);

  const initialEvents = await getEventsInRange(rangeStart, rangeEnd);

  return (
    <div className="mx-auto max-w-6xl">
      <EventsCardList currentUserId={user.id} initialEvents={initialEvents} />
    </div>
  );
}

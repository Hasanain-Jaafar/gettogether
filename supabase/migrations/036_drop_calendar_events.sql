-- The events/calendar feature was removed from the app. Drop the table added in
-- 026_calendar_events.sql along with its trigger function. Dropping the table
-- also removes its policies, indexes and trigger.
--
-- WARNING: this permanently deletes every event stored in calendar_events.

drop table if exists public.calendar_events;
drop function if exists public.calendar_events_set_updated_at();

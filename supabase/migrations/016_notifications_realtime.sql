-- Add notifications table to Supabase realtime publication so INSERT/UPDATE
-- events are broadcast to subscribed clients (used by the header bell badge).

alter publication supabase_realtime add table public.notifications;

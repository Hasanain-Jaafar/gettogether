-- Without REPLICA IDENTITY FULL, Postgres only includes the primary key in
-- the "old" record of realtime UPDATE payloads. The header bell badge relies
-- on payload.old.read to detect unread -> read transitions and decrement the
-- unread count, so that value must be present.

alter table public.notifications replica identity full;

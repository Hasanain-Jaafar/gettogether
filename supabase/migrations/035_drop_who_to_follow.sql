-- The "who to follow" widget was removed from the app, so its RPC
-- (added in 032_who_to_follow_rpc.sql) is no longer called.

drop function if exists public.get_who_to_follow(uuid, integer);

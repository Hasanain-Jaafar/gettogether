-- Calendar events: users publish events visible to followers, public, or just themselves
-- Run after 025_xp_badges.sql

do $$ begin
  create type public.event_visibility as enum ('public', 'followers', 'private');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  visibility public.event_visibility not null default 'followers',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_events_ends_after_starts check (ends_at is null or ends_at >= starts_at)
);

alter table public.calendar_events enable row level security;

drop policy if exists "Read visible events" on public.calendar_events;
create policy "Read visible events"
  on public.calendar_events for select
  to authenticated
  using (
    user_id = auth.uid()
    or visibility = 'public'
    or (
      visibility = 'followers'
      and exists (
        select 1 from public.follows
        where follower_id = auth.uid() and following_id = calendar_events.user_id
      )
    )
  );

drop policy if exists "Insert own events" on public.calendar_events;
create policy "Insert own events"
  on public.calendar_events for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Update own events" on public.calendar_events;
create policy "Update own events"
  on public.calendar_events for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Delete own events" on public.calendar_events;
create policy "Delete own events"
  on public.calendar_events for delete
  to authenticated
  using (user_id = auth.uid());

create index if not exists calendar_events_user_starts_idx
  on public.calendar_events (user_id, starts_at);
create index if not exists calendar_events_starts_idx
  on public.calendar_events (starts_at);

create or replace function public.calendar_events_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists calendar_events_set_updated_at on public.calendar_events;
create trigger calendar_events_set_updated_at
  before update on public.calendar_events
  for each row execute function public.calendar_events_set_updated_at();

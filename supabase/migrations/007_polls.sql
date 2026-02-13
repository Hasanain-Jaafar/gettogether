-- Polls: Users can create polls in posts
-- Run after 006_reposts.sql

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade unique,
  question text not null,
  multiple_choice boolean default false,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.polls enable row level security;

create policy "Authenticated can read polls"
  on public.polls for select
  to authenticated
  using (true);

create policy "Users can insert own poll"
  on public.polls for insert
  to authenticated
  with check (
    auth.uid() = (select user_id from public.posts where id = post_id)
  );

create policy "Users can update own poll"
  on public.polls for update
  to authenticated
  using (
    auth.uid() = (select user_id from public.posts where id = post_id)
  );

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_text text not null,
  option_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.poll_options enable row level security;

create policy "Authenticated can read poll options"
  on public.poll_options for select
  to authenticated
  using (true);

create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint poll_votes_unique unique (poll_id, user_id)
);

alter table public.poll_votes enable row level security;

create policy "Authenticated can read poll votes"
  on public.poll_votes for select
  to authenticated
  using (true);

create policy "Authenticated can insert own vote"
  on public.poll_votes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own vote"
  on public.poll_votes for delete
  to authenticated
  using (auth.uid() = user_id);

create index if not exists polls_post_id_idx on public.polls(post_id);
create index if not exists polls_expires_at_idx on public.polls(expires_at);
create index if not exists poll_options_poll_id_idx on public.poll_options(poll_id);
create index if not exists poll_votes_poll_id_idx on public.poll_votes(poll_id);
create index if not exists poll_votes_option_id_idx on public.poll_votes(option_id);
create index if not exists poll_votes_user_id_idx on public.poll_votes(user_id);

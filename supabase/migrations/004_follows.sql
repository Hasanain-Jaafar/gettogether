-- Follows: Users can follow other users
-- Run after 003_bookmarks.sql

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint follows_follower_following_unique unique (follower_id, following_id),
  constraint follows_not_self check (follower_id != following_id)
);

alter table public.follows enable row level security;

create policy "Authenticated can read follows"
  on public.follows for select
  to authenticated
  using (true);

create policy "Authenticated can insert own follow"
  on public.follows for insert
  to authenticated
  with check (auth.uid() = follower_id);

create policy "Users can delete own follow"
  on public.follows for delete
  to authenticated
  using (auth.uid() = follower_id);

create index if not exists follows_follower_id_idx on public.follows(follower_id);
create index if not exists follows_following_id_idx on public.follows(following_id);
create index if not exists follows_created_at_desc_idx on public.follows(created_at desc);

-- Function to get follower count
create or replace function public.get_follower_count(user_id uuid)
returns integer as $$
  select count(*) from public.follows where following_id = user_id;
$$ language sql stable security definer;

-- Function to get following count
create or replace function public.get_following_count(user_id uuid)
returns integer as $$
  select count(*) from public.follows where follower_id = user_id;
$$ language sql stable security definer;

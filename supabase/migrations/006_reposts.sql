-- Reposts: Users can repost other users' posts
-- Run after 005_trending.sql

-- Add media_type column to posts table
alter table public.posts
  add column if not exists media_type text check (media_type in ('text', 'image', 'video', 'gif', 'poll', 'link'));

create table if not exists public.reposts (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text, -- For quote reposts
  created_at timestamptz not null default now(),
  constraint reposts_post_user_unique unique (post_id, user_id)
);

alter table public.reposts enable row level security;

create policy "Authenticated can read reposts"
  on public.reposts for select
  to authenticated
  using (true);

create policy "Authenticated can insert own repost"
  on public.reposts for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own repost"
  on public.reposts for delete
  to authenticated
  using (auth.uid() = user_id);

create index if not exists reposts_post_id_idx on public.reposts(post_id);
create index if not exists reposts_user_id_idx on public.reposts(user_id);
create index if not exists reposts_created_at_desc_idx on public.reposts(created_at desc);

-- Function to get repost count for a post
create or replace function public.get_repost_count(post_id uuid)
returns integer as $$
  select count(*) from public.reposts where post_id = $1;
$$ language sql stable security definer;

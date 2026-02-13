-- Bookmarks: Users can save posts for later
-- Run after 002_community.sql

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint bookmarks_post_user_unique unique (post_id, user_id)
);

alter table public.bookmarks enable row level security;

drop policy if exists "Authenticated can read bookmarks" on public.bookmarks;
create policy "Authenticated can read bookmarks"
  on public.bookmarks for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Authenticated can insert own bookmark" on public.bookmarks;
create policy "Authenticated can insert own bookmark"
  on public.bookmarks for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own bookmark" on public.bookmarks;
create policy "Users can delete own bookmark"
  on public.bookmarks for delete
  to authenticated
  using (auth.uid() = user_id);

create index if not exists bookmarks_post_id_idx on public.bookmarks(post_id);
create index if not exists bookmarks_user_id_idx on public.bookmarks(user_id);
create index if not exists bookmarks_created_at_desc_idx on public.bookmarks(created_at desc);

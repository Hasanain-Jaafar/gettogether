-- Notifications: User notifications for likes, comments, follows, reposts
-- Run after 012_post_metadata.sql

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('like', 'comment', 'follow', 'repost', 'mention', 'poll')),
  actor_id uuid references auth.users(id) on delete set null,
  post_id uuid references public.posts(id) on delete set null,
  comment_id uuid references public.comments(id) on delete set null,
  read boolean default false,
  created_at timestamptz not null default now(),
  data jsonb
);

alter table public.notifications enable row level security;

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_created_at_desc_idx on public.notifications(created_at desc);
create index if not exists notifications_read_idx on public.notifications(read, created_at desc);
create index if not exists notifications_type_idx on public.notifications(type);

-- Function to get unread notification count
create or replace function public.get_unread_count(user_id uuid)
returns integer as $$
  select count(*) from public.notifications
  where user_id = get_unread_count.user_id and read = false;
$$ language sql stable security definer;

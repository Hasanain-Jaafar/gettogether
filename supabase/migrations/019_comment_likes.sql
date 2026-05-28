-- Likes on comments. Mirrors the post-likes table.
create table if not exists public.comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint comment_likes_comment_user_unique unique (comment_id, user_id)
);

alter table public.comment_likes enable row level security;

drop policy if exists "Authenticated can read comment likes" on public.comment_likes;
create policy "Authenticated can read comment likes"
  on public.comment_likes for select
  to authenticated
  using (true);

drop policy if exists "Authenticated can insert own comment like" on public.comment_likes;
create policy "Authenticated can insert own comment like"
  on public.comment_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own comment like" on public.comment_likes;
create policy "Users can delete own comment like"
  on public.comment_likes for delete
  to authenticated
  using (auth.uid() = user_id);

create index if not exists comment_likes_comment_id_idx on public.comment_likes(comment_id);

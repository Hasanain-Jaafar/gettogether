-- Reactions: Multi-type emoji reactions on posts
-- Run after 008_link_previews.sql (or after 005_trending.sql if 008 doesn't exist)

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null check (char_length(emoji) >= 1 and char_length(emoji) <= 50),
  created_at timestamptz not null default now(),
  constraint reactions_post_user_emoji_unique unique (post_id, user_id, emoji)
);

alter table public.reactions enable row level security;

drop policy if exists "Authenticated can read reactions" on public.reactions;
create policy "Authenticated can read reactions"
  on public.reactions for select
  to authenticated
  using (true);

drop policy if exists "Authenticated can insert own reaction" on public.reactions;
create policy "Authenticated can insert own reaction"
  on public.reactions for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own reaction" on public.reactions;
create policy "Users can delete own reaction"
  on public.reactions for delete
  to authenticated
  using (auth.uid() = user_id);

create index if not exists reactions_post_id_idx on public.reactions(post_id);
create index if not exists reactions_user_id_idx on public.reactions(user_id);
create index if not exists reactions_emoji_idx on public.reactions(emoji);
create index if not exists reactions_created_at_desc_idx on public.reactions(created_at desc);

-- Function to get reaction counts for a post
create or replace function public.get_reaction_counts(post_id uuid)
returns jsonb as $$
  select jsonb_object_agg(emoji, count)
  from (
    select emoji, count(*) as count
    from public.reactions
    where post_id = $1
    group by emoji
  ) subquery;
$$ language sql stable security definer;

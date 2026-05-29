-- XP, Levels, and Badges
-- Run after 024_post_video_url.sql

-- 1. Add xp and level columns to profiles
alter table public.profiles
  add column if not exists xp integer not null default 0,
  add column if not exists level integer not null default 1;

create index if not exists profiles_xp_desc_idx on public.profiles(xp desc);

-- 2. Badges catalog
create table if not exists public.badges (
  key text primary key,
  name text not null,
  description text not null,
  icon text not null default 'Award',
  tier text not null check (tier in ('bronze', 'silver', 'gold')),
  threshold integer not null,
  metric text not null check (metric in (
    'posts_created',
    'comments_made',
    'likes_received',
    'comments_received',
    'reposts_received'
  ))
);

alter table public.badges enable row level security;

drop policy if exists "Authenticated can read badges" on public.badges;
create policy "Authenticated can read badges"
  on public.badges for select
  to authenticated
  using (true);

-- 3. User badges (awarded)
create table if not exists public.user_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_key text not null references public.badges(key) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_key)
);

alter table public.user_badges enable row level security;

drop policy if exists "Authenticated can read user badges" on public.user_badges;
create policy "Authenticated can read user badges"
  on public.user_badges for select
  to authenticated
  using (true);

create index if not exists user_badges_user_id_idx on public.user_badges(user_id);

-- 4. Level computation: level = floor(sqrt(xp / 50)) + 1, capped at 99
create or replace function public.compute_level(xp_value integer)
returns integer as $$
  select least(99, greatest(1, floor(sqrt(greatest(xp_value, 0)::numeric / 50))::int + 1));
$$ language sql immutable;

-- 5. Evaluate badges: insert any earned-but-not-yet-awarded badges for a user
create or replace function public.evaluate_badges(target_user_id uuid)
returns void as $$
declare
  b record;
  earned integer;
begin
  for b in select key, metric, threshold from public.badges loop
    earned := 0;
    if b.metric = 'posts_created' then
      select count(*) into earned from public.posts
        where user_id = target_user_id
          and coalesce(is_reply, false) = false;
    elsif b.metric = 'comments_made' then
      select count(*) into earned from public.comments
        where user_id = target_user_id;
    elsif b.metric = 'likes_received' then
      select count(*) into earned from public.likes l
        join public.posts p on p.id = l.post_id
        where p.user_id = target_user_id
          and l.user_id <> target_user_id;
    elsif b.metric = 'comments_received' then
      select count(*) into earned from public.comments c
        join public.posts p on p.id = c.post_id
        where p.user_id = target_user_id
          and c.user_id <> target_user_id;
    elsif b.metric = 'reposts_received' then
      select count(*) into earned from public.reposts r
        join public.posts p on p.id = r.post_id
        where p.user_id = target_user_id
          and r.user_id <> target_user_id;
    end if;

    if earned >= b.threshold then
      insert into public.user_badges (user_id, badge_key)
        values (target_user_id, b.key)
        on conflict do nothing;
    end if;
  end loop;
end;
$$ language plpgsql security definer;

-- 6. Award XP to a user, recompute level, evaluate badges
create or replace function public.award_xp(target_user_id uuid, amount integer)
returns void as $$
begin
  if target_user_id is null or amount = 0 then
    return;
  end if;
  update public.profiles
    set xp = greatest(0, xp + amount),
        level = public.compute_level(greatest(0, xp + amount))
    where id = target_user_id;
  perform public.evaluate_badges(target_user_id);
end;
$$ language plpgsql security definer;

-- 7. Per-event trigger functions

-- Post created: +5 to author (non-reply only)
create or replace function public.handle_post_xp()
returns trigger as $$
begin
  if coalesce(new.is_reply, false) = false then
    perform public.award_xp(new.user_id, 5);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists posts_xp on public.posts;
create trigger posts_xp
  after insert on public.posts
  for each row execute function public.handle_post_xp();

-- Like inserted: +1 to post author (skip self-like)
create or replace function public.handle_like_xp()
returns trigger as $$
declare
  author uuid;
begin
  select user_id into author from public.posts where id = new.post_id;
  if author is not null and author <> new.user_id then
    perform public.award_xp(author, 1);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists likes_xp on public.likes;
create trigger likes_xp
  after insert on public.likes
  for each row execute function public.handle_like_xp();

-- Comment inserted: +2 to commenter, +2 to post author (skip self-comments)
create or replace function public.handle_comment_xp()
returns trigger as $$
declare
  author uuid;
begin
  select user_id into author from public.posts where id = new.post_id;
  if author is null or author = new.user_id then
    -- still award commenter for engaging (only on others' posts);
    -- if self-comment, give nothing
    return new;
  end if;
  perform public.award_xp(new.user_id, 2);
  perform public.award_xp(author, 2);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists comments_xp on public.comments;
create trigger comments_xp
  after insert on public.comments
  for each row execute function public.handle_comment_xp();

-- Repost inserted: +3 to post author (skip self-repost)
create or replace function public.handle_repost_xp()
returns trigger as $$
declare
  author uuid;
begin
  select user_id into author from public.posts where id = new.post_id;
  if author is not null and author <> new.user_id then
    perform public.award_xp(author, 3);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists reposts_xp on public.reposts;
create trigger reposts_xp
  after insert on public.reposts
  for each row execute function public.handle_repost_xp();

-- 8. Seed badges (idempotent)
insert into public.badges (key, name, description, icon, tier, threshold, metric) values
  ('first_post',      'First Post',       'Created your first post.',                'Sparkles',   'bronze', 1,    'posts_created'),
  ('prolific_5',      'Getting Started',  'Posted 5 times.',                          'Pencil',     'bronze', 5,    'posts_created'),
  ('prolific_25',     'Prolific',         'Posted 25 times.',                         'PencilLine', 'silver', 25,   'posts_created'),
  ('commentator_10',  'Commentator',      'Made 10 comments.',                        'MessageCircle','bronze', 10, 'comments_made'),
  ('liked_10',        'Liked',            'Received 10 likes on your posts.',         'Heart',      'bronze', 10,   'likes_received'),
  ('liked_100',       'Well Loved',       'Received 100 likes on your posts.',        'Heart',      'silver', 100,  'likes_received'),
  ('liked_1000',      'Adored',           'Received 1000 likes on your posts.',       'Heart',      'gold',   1000, 'likes_received'),
  ('reposted_10',     'Echoed',           'Your posts were reposted 10 times.',       'Repeat2',    'silver', 10,   'reposts_received')
on conflict (key) do nothing;

-- Trending topics: Track popular hashtags
-- Run after 004_follows.sql

create table if not exists public.trending_topics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  count integer not null default 0,
  last_trending_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.trending_topics enable row level security;

drop policy if exists "Authenticated can read trending topics" on public.trending_topics;
create policy "Authenticated can read trending topics"
  on public.trending_topics for select
  to authenticated
  using (true);

-- Only allow service role to update trending topics (via function)
drop policy if exists "Service role can update trending topics" on public.trending_topics;
create policy "Service role can update trending topics"
  on public.trending_topics for all
  to service_role
  using (true);

create index if not exists trending_topics_count_desc_idx on public.trending_topics(count desc);
create index if not exists trending_topics_last_trending_idx on public.trending_topics(last_trending_at desc);

-- Function to update trending topics based on hashtags in posts
create or replace function public.update_trending_topics()
returns void as $$
declare
  post_record record;
  hashtag text;
  existing_count integer;
begin
  -- Get posts created in the last 24 hours
  for post_record in
    select id, content from public.posts
    where created_at > now() - interval '24 hours'
  loop
    -- Extract hashtags from post content
    for hashtag in
      select regexp_matches(post_record.content, '#(\w+)', 'g')
    loop
      -- Upsert the trending topic
      insert into public.trending_topics (name, count, last_trending_at)
      values (hashtag, 1, now())
      on conflict (name)
      do update set
        count = trending_topics.count + 1,
        last_trending_at = now();
    end loop;
  end loop;

  -- Decay old trending topics (reduce count for those not updated in 24h)
  update public.trending_topics
  set count = greatest(count - 1, 0)
  where last_trending_at < now() - interval '24 hours';

  -- Remove topics with 0 count and older than 7 days
  delete from public.trending_topics
  where count = 0 and last_trending_at < now() - interval '7 days';
end;
$$ language plpgsql security definer;

-- Function to extract hashtags from text and return them as an array
create or replace function public.extract_hashtags(text text)
returns text[] as $$
  select array(select distinct regexp_matches[1] from regexp_matches(text, '#(\w+)', 'g'));
$$ language sql immutable;

-- Link previews: Store metadata for links in posts
-- Run after 007_polls.sql

create table if not exists public.link_previews (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  title text,
  description text,
  image_url text,
  favicon_url text,
  site_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.link_previews enable row level security;

create policy "Authenticated can read link previews"
  on public.link_previews for select
  to authenticated
  using (true);

create policy "Service role can update link previews"
  on public.link_previews for all
  to service_role
  using (true);

create index if not exists link_previews_url_idx on public.link_previews(url);
create index if not exists link_previews_created_at_desc_idx on public.link_previews(created_at desc);

-- Keep link_previews.updated_at in sync
drop trigger if exists link_previews_updated_at on public.link_previews;
create trigger link_previews_updated_at
  before update on public.link_previews
  for each row execute function public.set_updated_at();

-- Function to extract URLs from text
create or replace function public.extract_urls(text text)
returns text[] as $$
  select array(select distinct url from regexp_matches(text, '(https?:\/\/[^\s]+)', 'g') as url);
$$ language sql immutable;

-- Function to get or create link preview
create or replace function public.get_or_create_link_preview(url text)
returns uuid as $$
declare
  preview_id uuid;
begin
  -- Try to get existing preview
  select id into preview_id from public.link_previews where link_previews.url = $1 limit 1;

  if preview_id is not null then
    return preview_id;
  end if;

  -- Create new preview (data will be filled by background job)
  insert into public.link_previews (url)
  values ($1)
  returning id into preview_id;

  return preview_id;
end;
$$ language plpgsql security definer;

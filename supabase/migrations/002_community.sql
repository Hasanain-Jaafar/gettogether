-- Community: posts, likes, comments. Run after schema.sql (profiles exist).

-- posts
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "Authenticated can read posts"
  on public.posts for select
  to authenticated
  using (true);

create policy "Authenticated can insert own post"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own post"
  on public.posts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own post"
  on public.posts for delete
  to authenticated
  using (auth.uid() = user_id);

create index if not exists posts_user_id_idx on public.posts(user_id);
create index if not exists posts_created_at_desc_idx on public.posts(created_at desc);

-- likes
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  constraint likes_post_user_unique unique (post_id, user_id)
);

alter table public.likes enable row level security;

create policy "Authenticated can read likes"
  on public.likes for select
  to authenticated
  using (true);

create policy "Authenticated can insert own like"
  on public.likes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own like"
  on public.likes for delete
  to authenticated
  using (auth.uid() = user_id);

create index if not exists likes_post_id_idx on public.likes(post_id);

-- comments
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "Authenticated can read comments"
  on public.comments for select
  to authenticated
  using (true);

create policy "Authenticated can insert own comment"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own comment"
  on public.comments for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own comment"
  on public.comments for delete
  to authenticated
  using (auth.uid() = user_id);

create index if not exists comments_post_id_idx on public.comments(post_id);

-- Profiles: allow authenticated users to read any profile (for feed and public profile pages)
create policy "Authenticated can read any profile"
  on public.profiles for select
  to authenticated
  using (true);

-- optional: keep posts.updated_at in sync
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

drop trigger if exists comments_updated_at on public.comments;
create trigger comments_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

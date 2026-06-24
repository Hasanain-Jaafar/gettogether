-- Posts must be tagged with a category at creation time.
alter table public.posts
  add column if not exists category text not null default 'diaries';

alter table public.posts
  drop constraint if exists posts_category_check;
alter table public.posts
  add constraint posts_category_check
  check (category in ('songs', 'diaries', 'culture', 'morning'));

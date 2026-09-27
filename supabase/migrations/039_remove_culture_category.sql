-- The "culture" (ثقافة) category was removed from the app. Move existing
-- culture posts to "diaries" (the column default) so they keep a valid
-- category, then stop accepting "culture".
--
-- Run after 037_remove_morning_category.sql, which already moved every
-- "morning" post (the new check below no longer allows it either).

update public.posts set category = 'diaries' where category = 'culture';

alter table public.posts
  drop constraint if exists posts_category_check;
alter table public.posts
  add constraint posts_category_check
  check (category in ('songs', 'diaries', 'images'));

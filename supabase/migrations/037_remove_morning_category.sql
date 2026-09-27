-- The "morning" (صباحية) category was removed from the app. Move existing
-- morning posts to "diaries" (the column default) so they keep a valid
-- category, then stop accepting "morning".

update public.posts set category = 'diaries' where category = 'morning';

alter table public.posts
  drop constraint if exists posts_category_check;
alter table public.posts
  add constraint posts_category_check
  check (category in ('songs', 'diaries', 'culture', 'images'));

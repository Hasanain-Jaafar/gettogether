-- Post video orientation: lets the feed size Bunny Stream embeds to match the
-- source video instead of always forcing a 16:9 box (which crops portrait videos).

alter table public.posts
  add column if not exists video_orientation text
  check (video_orientation in ('landscape', 'portrait'));

-- Post video URL: external link for videos larger than the storage upload limit
-- (YouTube / TikTok / direct mp4 URL etc., rendered as an embed in the post card)

alter table public.posts
  add column if not exists video_url text;

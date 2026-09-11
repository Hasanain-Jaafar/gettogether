-- Post image dimensions: lets the feed render uploaded images with next/image
-- (real srcset resizing, WebP/AVIF conversion) instead of a raw, full-size <img>.

alter table public.posts
  add column if not exists image_width integer,
  add column if not exists image_height integer;

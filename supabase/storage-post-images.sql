-- Run in Supabase SQL Editor after creating the "post-images" bucket (Storage → New bucket → name: post-images, Public).
-- Upload path must be: {user_id}/{filename} (e.g. 550e8400-e29b-41d4-a716-446655440000/abc123.png)

drop policy if exists "Users can upload own post image" on storage.objects;
drop policy if exists "Users can update own post image" on storage.objects;
drop policy if exists "Users can read own post image" on storage.objects;
drop policy if exists "Users can delete own post image" on storage.objects;

create policy "Users can upload own post image"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update own post image"
on storage.objects for update to authenticated
using (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can read own post image"
on storage.objects for select to authenticated
using (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete own post image"
on storage.objects for delete to authenticated
using (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Run this in Supabase SQL Editor after creating the "avatars" bucket.
-- These policies allow authenticated users to upload, update, and read only their own avatar.
-- Upload path must be: {user_id}/filename (e.g. 550e8400-e29b-41d4-a716-446655440000/avatar.png)

drop policy if exists "Users can upload own avatar" on storage.objects;
drop policy if exists "Users can update own avatar" on storage.objects;
drop policy if exists "Users can read own avatar" on storage.objects;
drop policy if exists "Users can delete own avatar" on storage.objects;

-- Allow users to upload into their own folder (path first segment = auth.uid())
create policy "Users can upload own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update/overwrite their own avatar (required for upsert)
create policy "Users can update own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own avatar (optional; public bucket already allows read)
create policy "Users can read own avatar"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own avatar
create policy "Users can delete own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

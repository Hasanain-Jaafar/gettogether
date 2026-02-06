# Supabase Storage Setup (Avatars)

1. In **Supabase Dashboard** go to **Storage**.
2. Click **New bucket**.
3. Name: `avatars`.
4. Set the bucket to **Public** (so avatar URLs can be used in `<img>` without signed URLs).
5. Click **Create bucket**.

## Storage policies (required for avatar upload)

**Run the SQL in [`storage-policies.sql`](storage-policies.sql) in the Supabase SQL Editor.**  
That file adds RLS policies so authenticated users can upload, update, read, and delete only files under their own folder (`{user_id}/...`).

Without these policies you’ll get **“new row violates row-level security policy”** when changing an avatar, because Storage uses RLS on `storage.objects`.

- Upload path in the app must be: `{user_id}/avatar.{ext}` (e.g. `550e8400-e29b-41d4-a716-446655440000/avatar.png`).
- The first path segment must be the authenticated user's UUID so the policy allows the insert/update.

## Post images bucket

1. In **Storage** create a new bucket: name `post-images`, **Public**.
2. Run the SQL in **`storage-post-images.sql`** in the SQL Editor to add RLS policies. Upload path in the app must be `{user_id}/{filename}`.

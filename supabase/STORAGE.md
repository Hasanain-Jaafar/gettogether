# Supabase Storage Setup (Avatars)

1. In **Supabase Dashboard** go to **Storage**.
2. Click **New bucket**.
3. Name: `avatars`.
4. Set the bucket to **Public** (so avatar URLs can be used in `<img>` without signed URLs).
5. Click **Create bucket**.

## Storage policies

Create a policy so users can only upload/update/delete their own avatar:

1. Open the `avatars` bucket → **Policies**.
2. **New policy** → **For full customization**.
3. Policy name: `Users can upload and update own avatar`
4. Allowed operation: **INSERT** (or allow INSERT, UPDATE, DELETE for full control).
5. Target roles: `authenticated`.
6. USING expression (for SELECT/UPDATE/DELETE): `(bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)`
7. WITH CHECK expression (for INSERT): `(bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)`

Alternatively, use a single policy with multiple operations:

- **Policy name**: `Users can manage own avatar`
- **Allowed operations**: SELECT, INSERT, UPDATE, DELETE
- **USING**: `(bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)`
- **WITH CHECK**: `(bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)`

Files should be uploaded to path: `avatars/{user_id}/{filename}` (e.g. `avatars/550e8400-e29b-41d4-a716-446655440000/avatar.png`) so the folder name equals the user id.

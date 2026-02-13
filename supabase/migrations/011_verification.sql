-- Verification: User verification badges
-- Run after 010_threads.sql

-- Add verification columns to profiles table
alter table public.profiles
  add column if not exists is_verified boolean default false,
  add column if not exists verification_type text check (verification_type in ('individual', 'organization', 'government'));

-- Add index for verified users
create index if not exists profiles_is_verified_idx on public.profiles(is_verified);

-- Update profile policies to allow verification updates by service role
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id and
    (coalesce(old.is_verified, false) = coalesce(new.is_verified, false) or -- Cannot change own verification
     coalesce(old.verification_type, null) = coalesce(new.verification_type, null))
  );

-- Allow service role to update verification status
create policy "Service role can verify profiles"
  on public.profiles for update
  to service_role
  using (true)
  with check (true);

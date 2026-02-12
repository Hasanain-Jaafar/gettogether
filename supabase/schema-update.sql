-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- This adds new fields to the existing profiles table

-- Add new columns to profiles table
alter table public.profiles
  add column if not exists location text,
  add column if not exists interests text[],
  add column if not exists pronouns text,
  add column if not exists website text,
  add column if not exists birthday date,
  add column if not exists relationship_status text,
  add column if not exists show_birthday boolean default true,
  add column if not exists show_age boolean default true,
  add column if not exists show_location boolean default true;

-- Create indexes for better query performance
create index if not exists profiles_interests_idx on public.profiles using gin (interests);
create index if not exists profiles_location_idx on public.profiles (location);

-- Add check constraint for valid pronouns
alter table public.profiles
  add constraint if not exists pronouns_check
  check (
    pronouns is null or
    pronouns in ('she/her', 'he/him', 'they/them', 'any pronouns', 'prefer not to say')
  );

-- Add check constraint for valid relationship status
alter table public.profiles
  add constraint if not exists relationship_status_check
  check (
    relationship_status is null or
    relationship_status in ('single', 'in a relationship', 'it\'s complicated', 'married', 'prefer not to say')
  );

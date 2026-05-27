-- Profile extras: location, pronouns, interests, website, birthday,
-- relationship status, and per-field visibility toggles.
-- Run after 013_notifications.sql.

alter table public.profiles
  add column if not exists location text,
  add column if not exists pronouns text,
  add column if not exists interests text[] not null default '{}',
  add column if not exists website text,
  add column if not exists birthday date,
  add column if not exists relationship_status text,
  add column if not exists show_birthday boolean not null default true,
  add column if not exists show_age boolean not null default true,
  add column if not exists show_location boolean not null default true;

-- Optional sanity constraints to match the zod schema in
-- src/lib/validations/profile.ts. Use NOT VALID so the migration won't
-- fail on any pre-existing free-text rows.

alter table public.profiles
  drop constraint if exists profiles_pronouns_check;
alter table public.profiles
  add constraint profiles_pronouns_check
  check (
    pronouns is null
    or pronouns in ('she/her', 'he/him', 'they/them', 'any pronouns', 'prefer not to say')
  ) not valid;

alter table public.profiles
  drop constraint if exists profiles_relationship_status_check;
alter table public.profiles
  add constraint profiles_relationship_status_check
  check (
    relationship_status is null
    or relationship_status in ('single', 'in a relationship', 'it''s complicated', 'married', 'prefer not to say')
  ) not valid;

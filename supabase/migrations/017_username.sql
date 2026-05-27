-- Add username support: lowercase unique identifier stored on profiles,
-- populated from signup metadata, and resolvable to email for username-based login.

alter table public.profiles
  add column if not exists username text;

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

-- Extend signup trigger to populate username from metadata when provided.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, username)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      'User'
    ),
    nullif(lower(new.raw_user_meta_data->>'username'), '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Resolve a username to its auth email. Returns null if no match.
-- SECURITY DEFINER so unauthenticated clients can call it during sign-in.
create or replace function public.get_email_by_username(p_username text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text;
begin
  select id into v_user_id
  from public.profiles
  where lower(username) = lower(p_username)
  limit 1;

  if v_user_id is null then
    return null;
  end if;

  select email into v_email
  from auth.users
  where id = v_user_id;

  return v_email;
end;
$$;

grant execute on function public.get_email_by_username(text) to anon, authenticated;

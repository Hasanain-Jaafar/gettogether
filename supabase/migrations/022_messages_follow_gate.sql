-- Restrict start_conversation to people in the caller's follow graph
-- (either direction). Replaces the function from migration 021.

create or replace function public.start_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  conv uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if other_user_id = me then
    raise exception 'Cannot message yourself';
  end if;

  if not exists (
    select 1 from public.follows f
    where (f.follower_id = me and f.following_id = other_user_id)
       or (f.follower_id = other_user_id and f.following_id = me)
  ) then
    raise exception 'You can only message people you follow or who follow you';
  end if;

  select c.id into conv
  from public.conversations c
  where exists (
    select 1 from public.conversation_participants p
    where p.conversation_id = c.id and p.user_id = me
  )
  and exists (
    select 1 from public.conversation_participants p
    where p.conversation_id = c.id and p.user_id = other_user_id
  )
  limit 1;

  if conv is not null then
    return conv;
  end if;

  insert into public.conversations default values returning id into conv;
  insert into public.conversation_participants (conversation_id, user_id)
  values (conv, me), (conv, other_user_id);

  return conv;
end;
$$;

revoke all on function public.start_conversation(uuid) from public;
grant execute on function public.start_conversation(uuid) to authenticated;

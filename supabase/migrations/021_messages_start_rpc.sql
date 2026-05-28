-- start_conversation(other_user_id): atomically find-or-create a 1:1
-- conversation between the caller and the target user, and insert both
-- participant rows. Runs as SECURITY DEFINER so it can insert the other
-- user's participant row without tripping the per-user RLS policy.

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

  -- Existing 1:1 conversation between exactly these two users.
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

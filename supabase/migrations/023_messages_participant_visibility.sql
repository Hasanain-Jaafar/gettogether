-- Allow conversation members to see ALL participants of that conversation
-- (not just their own row). Needed so the conversation page can resolve
-- the "other" participant. Uses a SECURITY DEFINER helper to avoid the
-- recursive-RLS pitfall of querying conversation_participants from its
-- own SELECT policy.

create or replace function public.is_conversation_member(conv_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = conv_id and user_id = auth.uid()
  );
$$;

revoke all on function public.is_conversation_member(uuid) from public;
grant execute on function public.is_conversation_member(uuid) to authenticated;

drop policy if exists "Participants see own rows" on public.conversation_participants;
drop policy if exists "Members see participants" on public.conversation_participants;
create policy "Members see participants"
  on public.conversation_participants for select
  to authenticated
  using (public.is_conversation_member(conversation_id));

-- Direct messages: 1:1 conversations with messages, read receipts.

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default 'epoch'::timestamptz,
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists conversation_participants_user_id_idx
  on public.conversation_participants(user_id);
create index if not exists messages_conversation_id_created_at_idx
  on public.messages(conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

-- Participants: a user can see their own membership rows.
drop policy if exists "Participants see own rows" on public.conversation_participants;
create policy "Participants see own rows"
  on public.conversation_participants for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Participants insert own rows" on public.conversation_participants;
create policy "Participants insert own rows"
  on public.conversation_participants for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Participants update own row" on public.conversation_participants;
create policy "Participants update own row"
  on public.conversation_participants for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Conversations: visible only if the user is a participant.
drop policy if exists "Members can read conversations" on public.conversations;
create policy "Members can read conversations"
  on public.conversations for select
  to authenticated
  using (
    exists (
      select 1 from public.conversation_participants p
      where p.conversation_id = id and p.user_id = auth.uid()
    )
  );

drop policy if exists "Authenticated can create conversations" on public.conversations;
create policy "Authenticated can create conversations"
  on public.conversations for insert
  to authenticated
  with check (true);

drop policy if exists "Members can touch conversations" on public.conversations;
create policy "Members can touch conversations"
  on public.conversations for update
  to authenticated
  using (
    exists (
      select 1 from public.conversation_participants p
      where p.conversation_id = id and p.user_id = auth.uid()
    )
  )
  with check (true);

-- Messages: only participants can read; only the sender can insert.
drop policy if exists "Members can read messages" on public.messages;
create policy "Members can read messages"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.conversation_participants p
      where p.conversation_id = messages.conversation_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "Members can send messages" on public.messages;
create policy "Members can send messages"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id and exists (
      select 1 from public.conversation_participants p
      where p.conversation_id = messages.conversation_id and p.user_id = auth.uid()
    )
  );

-- Bump the conversation's last_message_at whenever a message lands.
create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
     set last_message_at = new.created_at
   where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation_on_message();

-- Realtime so clients get new-message events and read-receipt updates.
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversation_participants;

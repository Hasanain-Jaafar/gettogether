-- Allow authenticated users to insert notifications they originate.
-- Required so server actions running with the user's JWT can create
-- "like"/"comment"/"follow"/"repost"/"mention" rows for the recipient.

drop policy if exists "Users can insert notifications they originate" on public.notifications;
create policy "Users can insert notifications they originate"
  on public.notifications for insert
  to authenticated
  with check (auth.uid() = actor_id);

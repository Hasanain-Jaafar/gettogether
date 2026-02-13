-- Threads: Support for threaded conversations
-- Run after 009_reactions.sql

-- Add thread support columns to posts table
alter table public.posts
  add column if not exists parent_post_id uuid references public.posts(id) on delete cascade,
  add column if not exists is_reply boolean default false,
  add column if not exists reply_count integer default 0;

-- Add indexes for thread queries
create index if not exists posts_parent_post_id_idx on public.posts(parent_post_id);
create index if not exists posts_is_reply_idx on public.posts(is_reply);
create index if not exists posts_reply_count_desc_idx on public.posts(reply_count desc);

-- Function to increment reply count
create or replace function public.increment_reply_count()
returns trigger as $$
begin
  if new.parent_post_id is not null then
    update public.posts
    set reply_count = reply_count + 1
    where id = new.parent_post_id;
  end if;
  return new;
end;
$$ language plpgsql;

-- Function to decrement reply count
create or replace function public.decrement_reply_count()
returns trigger as $$
begin
  if old.parent_post_id is not null then
    update public.posts
    set reply_count = greatest(reply_count - 1, 0)
    where id = old.parent_post_id;
  end if;
  return old;
end;
$$ language plpgsql;

-- Triggers for reply count management
drop trigger if exists increment_reply_count_trigger on public.posts;
create trigger increment_reply_count_trigger
  after insert on public.posts
  for each row execute function public.increment_reply_count();

drop trigger if exists decrement_reply_count_trigger on public.posts;
create trigger decrement_reply_count_trigger
  after delete on public.posts
  for each row execute function public.decrement_reply_count();

-- Update is_reply column based on parent_post_id
drop trigger if exists set_is_reply_trigger on public.posts;
create trigger set_is_reply_trigger
  before insert or update on public.posts
  for each row execute function $$
begin
  new.is_reply := (new.parent_post_id is not null);
end;
$$ language plpgsql;

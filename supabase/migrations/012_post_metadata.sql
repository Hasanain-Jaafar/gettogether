-- Post metadata: Additional columns for posts
-- Run after 011_verification.sql (or after 002_community.sql if 011 doesn't exist)

-- Add reaction_counts column to posts
alter table public.posts
  add column if not exists reaction_counts jsonb default '{}'::jsonb;

-- Add indexes for better performance
create index if not exists posts_reaction_counts_idx on public.posts using gin (reaction_counts);

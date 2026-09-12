-- getWhoToFollow was doing 3 sequential round trips from the app (following
-- ids -> candidate profiles -> per-candidate mutual-follower counts). Move
-- the whole thing into one query so the dashboard only pays for one round
-- trip instead of three.

create or replace function public.get_who_to_follow(p_user_id uuid, p_limit integer default 5)
returns table(id uuid, name text, avatar_url text, mutual_followers integer)
language sql
stable
security definer
set search_path = public
as $$
  with my_following as (
    select following_id from public.follows where follower_id = p_user_id
  ),
  candidates as (
    select pr.id, pr.name, pr.avatar_url
    from public.profiles pr
    where pr.id != p_user_id
      and pr.id not in (select following_id from my_following)
    limit p_limit * 3
  )
  select
    c.id,
    c.name,
    c.avatar_url,
    count(f.follower_id)::integer as mutual_followers
  from candidates c
  left join public.follows f
    on f.following_id = c.id
    and f.follower_id in (select following_id from my_following)
  group by c.id, c.name, c.avatar_url
  order by mutual_followers desc
  limit p_limit;
$$;

grant execute on function public.get_who_to_follow(uuid, integer) to authenticated;

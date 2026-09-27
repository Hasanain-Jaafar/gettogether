-- loadFeedPage was doing 3 sequential round trips from the app (posts ->
-- likes + comments -> profiles + comment likes). Build the whole page,
-- already shaped for PostCard, in one query so the dashboard pays for one
-- round trip instead of three.
--
-- security invoker (the default) keeps RLS applying exactly as it did for the
-- separate queries; auth.uid() is the signed-in user.

create or replace function public.get_feed_page(
  p_hashtag text default null,
  p_category text default null,
  p_before timestamptz default null,
  p_limit integer default 20
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with page_plus as (
    -- One extra row tells us whether another page exists.
    select p.*
    from public.posts p
    where (p_hashtag is null or p.content ilike '%#' || p_hashtag || '%')
      and (p_category is null or p.category = p_category)
      and (p_before is null or p.created_at < p_before)
    order by p.created_at desc
    limit p_limit + 1
  ),
  page as (
    select * from page_plus order by created_at desc limit p_limit
  )
  select jsonb_build_object(
    'has_more', (select count(*) from page_plus) > p_limit,
    'items', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'post', jsonb_build_object(
            'id', pg.id,
            'user_id', pg.user_id,
            'content', pg.content,
            'image_url', pg.image_url,
            'image_width', pg.image_width,
            'image_height', pg.image_height,
            'video_url', pg.video_url,
            'video_orientation', pg.video_orientation,
            'created_at', pg.created_at,
            'category', pg.category
          ),
          'author', coalesce(
            (select jsonb_build_object('name', pr.name, 'avatar_url', pr.avatar_url, 'level', pr.level)
             from public.profiles pr where pr.id = pg.user_id),
            jsonb_build_object('name', null, 'avatar_url', null)
          ),
          'likeCount', (select count(*) from public.likes l where l.post_id = pg.id),
          'currentUserLiked', exists (
            select 1 from public.likes l where l.post_id = pg.id and l.user_id = auth.uid()
          ),
          'likers', coalesce((
            select jsonb_agg(jsonb_build_object('name', pr.name, 'avatar_url', pr.avatar_url))
            from public.likes l
            join public.profiles pr on pr.id = l.user_id
            where l.post_id = pg.id
          ), '[]'::jsonb),
          'commentCount', (select count(*) from public.comments c where c.post_id = pg.id),
          'comments', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', c.id,
                'post_id', c.post_id,
                'content', c.content,
                'created_at', c.created_at,
                'user_id', c.user_id,
                'parent_id', c.parent_id,
                'author', (
                  select jsonb_build_object('id', pr.id, 'name', pr.name, 'avatar_url', pr.avatar_url, 'level', pr.level)
                  from public.profiles pr where pr.id = c.user_id
                ),
                'like_count', (select count(*) from public.comment_likes cl where cl.comment_id = c.id),
                'liked_by_me', exists (
                  select 1 from public.comment_likes cl
                  where cl.comment_id = c.id and cl.user_id = auth.uid()
                )
              )
              order by c.created_at asc
            )
            from public.comments c
            where c.post_id = pg.id
          ), '[]'::jsonb)
        )
        order by pg.created_at desc
      )
      from page pg
    ), '[]'::jsonb)
  );
$$;

grant execute on function public.get_feed_page(text, text, timestamptz, integer) to authenticated;

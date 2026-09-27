-- The feed was shipping every comment (with authors and like state) and every
-- liker for all 20 posts, even though comments stay collapsed until tapped and
-- the likes popover only lists 10 people. That payload grows with every
-- popular post and is serialized into the page on each load.
--
-- get_feed_page now returns only comment counts and at most 10 likers per
-- post; comments are loaded on demand with get_post_comments when a post's
-- comment section is opened.

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
          -- The likes popover lists at most 10 people and shows "and N more" for the rest.
          'likers', coalesce((
            select jsonb_agg(jsonb_build_object('name', x.name, 'avatar_url', x.avatar_url))
            from (
              select pr.name, pr.avatar_url
              from public.likes l
              join public.profiles pr on pr.id = l.user_id
              where l.post_id = pg.id
              limit 10
            ) x
          ), '[]'::jsonb),
          'commentCount', (select count(*) from public.comments c where c.post_id = pg.id)
        )
        order by pg.created_at desc
      )
      from page pg
    ), '[]'::jsonb)
  );
$$;

-- One post's comments, oldest first, shaped for CommentSection.
create or replace function public.get_post_comments(p_post_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(
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
  ), '[]'::jsonb)
  from public.comments c
  where c.post_id = p_post_id;
$$;

grant execute on function public.get_post_comments(uuid) to authenticated;

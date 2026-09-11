import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreatePostForm } from "@/components/feed/create-post-form";
import { PostCard } from "@/components/feed/post-card";
import { DashboardRealtime } from "@/components/feed/dashboard-realtime";
import { ScrollToTop } from "@/components/feed/scroll-to-top";
import { DashboardSidebar } from "@/components/feed/dashboard-sidebar";
import { EmptyState } from "@/components/feed/empty-state";
import { getForYouFeed } from "@/app/[locale]/(dashboard)/actions/feed";
import { getWhoToFollow } from "@/app/[locale]/(dashboard)/actions/follows";
import { CategoryFilterBar } from "@/components/feed/category-filter-bar";
import { isPostCategory, type PostCategory } from "@/lib/post-categories";

const POSTS_PAGE_SIZE = 20;

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ hashtag?: string; category?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const tSidebar = await getTranslations("sidebar");
  const tFeed = await getTranslations("feed.empty");
  const { hashtag: hashtagParam, category: categoryParam } = await searchParams;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const userId = user.id;

  const hashtag = hashtagParam;
  const category: PostCategory | null = isPostCategory(categoryParam) ? categoryParam : null;

  async function fetchPosts(): Promise<any[]> {
    if (hashtag || category) {
      let query = supabase
        .from("posts")
        .select("id, user_id, content, image_url, image_width, image_height, video_url, video_orientation, created_at, category");
      if (hashtag) query = query.ilike("content", `%#${hashtag}%`);
      if (category) query = query.eq("category", category);
      const { data: filteredPosts } = await query
        .order("created_at", { ascending: false })
        .limit(POSTS_PAGE_SIZE);
      return filteredPosts ?? [];
    }
    const feedResult = await getForYouFeed(userId, POSTS_PAGE_SIZE);
    return feedResult.posts;
  }

  // These two don't depend on each other — fetch them together instead of waiting in sequence.
  const [whoToFollowInitial, posts] = await Promise.all([
    getWhoToFollow(userId, 3),
    fetchPosts(),
  ]);

  if (!posts?.length) {
    return (
      <>
        <DashboardRealtime />
        <ScrollToTop />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            <CreatePostForm userId={user.id} />
            <CategoryFilterBar active={category} />
            <EmptyState
              type={category ? "no-results" : "welcome"}
              actionLabel={category ? undefined : tFeed("createFirst")}
              actionTarget={category ? undefined : "focus-create-post"}
            />
          </div>
          <div className="lg:col-span-1 hidden lg:block">
            <DashboardSidebar
              whoToFollowInitial={whoToFollowInitial}
            />
          </div>
        </div>
      </>
    );
  }

  const userIds = [...new Set(posts.map((p) => p.user_id))];
  const postIds = posts.map((p) => p.id);

  // likes and comments only depend on postIds, so fetch them together.
  const [{ data: likes }, { data: comments }] = await Promise.all([
    supabase.from("likes").select("post_id, user_id").in("post_id", postIds),
    supabase
      .from("comments")
      .select("id, post_id, content, created_at, user_id, parent_id")
      .in("post_id", postIds)
      .order("created_at", { ascending: true }),
  ]);

  const likeCountMap = new Map<string, number>();
  const userLikedSet = new Set<string>();
  const likesByPost = new Map<string, string[]>();
  likes?.forEach((l) => {
    likeCountMap.set(l.post_id, (likeCountMap.get(l.post_id) ?? 0) + 1);
    if (l.user_id === user.id) userLikedSet.add(l.post_id);

    const likers = likesByPost.get(l.post_id) ?? [];
    likers.push(l.user_id);
    likesByPost.set(l.post_id, likers);
  });

  const commentCountMap = new Map<string, number>();
  comments?.forEach((c) =>
    commentCountMap.set(c.post_id, (commentCountMap.get(c.post_id) ?? 0) + 1)
  );

  // Post authors, likers and commenters overlap heavily — fetch every profile
  // we'll need in one query instead of three, once we know who they all are.
  const likerUserIds = [...new Set(likes?.map((l) => l.user_id) ?? [])];
  const commentUserIds = [...new Set(comments?.map((c) => c.user_id) ?? [])];
  const allProfileIds = [...new Set([...userIds, ...likerUserIds, ...commentUserIds])];
  const commentIds = comments?.map((c) => c.id) ?? [];

  const [{ data: profiles }, { data: commentLikes }] = await Promise.all([
    supabase.from("profiles").select("id, name, avatar_url, level").in("id", allProfileIds),
    commentIds.length
      ? supabase.from("comment_likes").select("comment_id, user_id").in("comment_id", commentIds)
      : Promise.resolve({ data: [] as { comment_id: string; user_id: string }[] }),
  ]);

  const profileMap = new Map(profiles?.map((pr) => [pr.id, pr]) ?? []);

  const commentLikeCount = new Map<string, number>();
  const commentLikedByMe = new Set<string>();
  commentLikes?.forEach((l) => {
    commentLikeCount.set(l.comment_id, (commentLikeCount.get(l.comment_id) ?? 0) + 1);
    if (l.user_id === user.id) commentLikedByMe.add(l.comment_id);
  });

  type CommentWithAuthor = NonNullable<typeof comments>[0] & {
    author: { name: string | null; avatar_url: string | null } | null;
    like_count: number;
    liked_by_me: boolean;
  };
  const commentsByPost = new Map<string, CommentWithAuthor[]>();
  comments?.forEach((c) => {
    const list = commentsByPost.get(c.post_id) ?? [];
    list.push({
      ...c,
      author: profileMap.get(c.user_id) ?? null,
      like_count: commentLikeCount.get(c.id) ?? 0,
      liked_by_me: commentLikedByMe.has(c.id),
    });
    commentsByPost.set(c.post_id, list);
  });

  return (
    <>
      <DashboardRealtime />
      <ScrollToTop />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          <CreatePostForm userId={user.id} />
          <CategoryFilterBar active={category} />
          {hashtag && (
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">#{hashtag}</h2>
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {tSidebar("clearFilter")}
              </Link>
            </div>
          )}
          <ul className="space-y-4">
            {posts.map((post: any) => (
              <li key={post.id}>
                <PostCard
                  post={post}
                  author={
                    profileMap.get(post.user_id) ?? { name: null, avatar_url: null }
                  }
                  likeCount={likeCountMap.get(post.id) ?? 0}
                  commentCount={commentCountMap.get(post.id) ?? 0}
                  currentUserLiked={userLikedSet.has(post.id)}
                  comments={commentsByPost.get(post.id) ?? []}
                  currentUserId={user.id}
                  likers={
                    likesByPost
                      .get(post.id)
                      ?.map((userId) => profileMap.get(userId))
                      .filter(
                        (profile): profile is { id: string; name: string | null; avatar_url: string | null; level: number | null } =>
                          profile !== undefined
                      )
                      .map(({ name, avatar_url }) => ({ name, avatar_url })) ?? []
                  }
                />
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-1 hidden lg:block">
          <DashboardSidebar
            whoToFollowInitial={whoToFollowInitial}
          />
        </div>
      </div>
    </>
  );
}

import { createClient } from "@/lib/supabase/server";
import { CreatePostForm } from "@/components/feed/create-post-form";
import { PostCard } from "@/components/feed/post-card";
import { DashboardRealtime } from "@/components/feed/dashboard-realtime";
import { DashboardSidebar } from "@/components/feed/dashboard-sidebar";
import { FeedTabs } from "@/components/feed/feed-tabs";
import { EmptyState } from "@/components/feed/empty-state";
import { getForYouFeed, getFollowingFeed } from "@/app/(dashboard)/actions/feed";

const POSTS_PAGE_SIZE = 20;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { tab?: string; hashtag?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const tab = searchParams.tab === "following" ? "following" : "foryou";
  const hashtag = searchParams.hashtag;

  // Get posts based on tab
  let posts: any[] = [];
  if (hashtag) {
    const { data: postsByHashtag } = await supabase
      .from("posts")
      .select("id, user_id, content, image_url, created_at")
      .ilike("content", `%#${hashtag}%`)
      .order("created_at", { ascending: false })
      .limit(POSTS_PAGE_SIZE);
    posts = postsByHashtag ?? [];
  } else if (tab === "following") {
    const feedResult = await getFollowingFeed(user.id, POSTS_PAGE_SIZE);
    posts = feedResult.posts;
  } else {
    const feedResult = await getForYouFeed(user.id, POSTS_PAGE_SIZE);
    posts = feedResult.posts;
  }

  if (!posts?.length) {
    return (
      <>
        <DashboardRealtime />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            <CreatePostForm userId={user.id} />
            {!hashtag && <FeedTabs />}
            <EmptyState
              type={tab === "following" ? "no-results" : "welcome"}
              actionLabel={tab === "following" ? "Find people to follow" : "Create your first post"}
              onAction={() => {
                if (tab === "following") {
                  // Scroll to who to follow section
                  document.getElementById("who-to-follow")?.scrollIntoView({ behavior: "smooth" });
                } else {
                  // Focus on create post form
                  document.querySelector("textarea")?.focus();
                }
              }}
            />
          </div>
          <div className="lg:col-span-1 hidden lg:block">
            <DashboardSidebar />
          </div>
        </div>
      </>
    );
  }

  const userIds = [...new Set(posts.map((p) => p.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .in("id", userIds);

  const profileMap = new Map(profiles?.map((pr) => [pr.id, pr]) ?? []);

  const postIds = posts.map((p) => p.id);
  const { data: likes } = await supabase
    .from("likes")
    .select("post_id, user_id")
    .in("post_id", postIds);

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

  // Get profiles of users who liked posts
  const likerUserIds = [...new Set(likes?.map((l) => l.user_id) ?? [])];
  const { data: likerProfiles } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .in("id", likerUserIds);
  const likerProfileMap = new Map(
    likerProfiles?.map((p) => [p.id, p]) ?? []
  );

  const { data: comments } = await supabase
    .from("comments")
    .select("id, post_id, content, created_at, user_id")
    .in("post_id", postIds)
    .order("created_at", { ascending: true });

  const commentUserIds = [...new Set(comments?.map((c) => c.user_id) ?? [])];
  const { data: commentProfiles } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .in("id", commentUserIds);
  const commentProfileMap = new Map(
    commentProfiles?.map((p) => [p.id, p]) ?? []
  );

  type CommentWithAuthor = NonNullable<typeof comments>[0] & {
    author: { name: string | null; avatar_url: string | null } | null;
  };
  const commentsByPost = new Map<string, CommentWithAuthor[]>();
  comments?.forEach((c) => {
    const list = commentsByPost.get(c.post_id) ?? [];
    list.push({
      ...c,
      author: commentProfileMap.get(c.user_id) ?? null,
    });
    commentsByPost.set(c.post_id, list);
  });

  const commentCountMap = new Map<string, number>();
  comments?.forEach((c) =>
    commentCountMap.set(c.post_id, (commentCountMap.get(c.post_id) ?? 0) + 1)
  );

  // Get bookmarks for posts
  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("post_id, user_id")
    .in("post_id", postIds);

  const bookmarkCountMap = new Map<string, number>();
  const userBookmarkedSet = new Set<string>();
  bookmarks?.forEach((b) => {
    bookmarkCountMap.set(b.post_id, (bookmarkCountMap.get(b.post_id) ?? 0) + 1);
    if (b.user_id === user.id) userBookmarkedSet.add(b.post_id);
  });

  // Get reposts for posts
  const { data: reposts } = await supabase
    .from("reposts")
    .select("post_id, user_id")
    .in("post_id", postIds);

  const repostCountMap = new Map<string, number>();
  const userRepostedSet = new Set<string>();
  reposts?.forEach((r) => {
    repostCountMap.set(r.post_id, (repostCountMap.get(r.post_id) ?? 0) + 1);
    if (r.user_id === user.id) userRepostedSet.add(r.post_id);
  });

  // Get follows to know who the user is following
  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);
  const followingIds = new Set(following?.map((f) => f.following_id) ?? []);

  return (
    <>
      <DashboardRealtime />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          <CreatePostForm userId={user.id} />
          {!hashtag && <FeedTabs />}
          {hashtag && (
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">#{hashtag}</h2>
              <button
                onClick={() => {
                  window.location.href = "/dashboard";
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Clear filter
              </button>
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
                  bookmarkCount={bookmarkCountMap.get(post.id) ?? 0}
                  repostCount={repostCountMap.get(post.id) ?? 0}
                  currentUserLiked={userLikedSet.has(post.id)}
                  currentUserBookmarked={userBookmarkedSet.has(post.id)}
                  currentUserReposted={userRepostedSet.has(post.id)}
                  comments={commentsByPost.get(post.id) ?? []}
                  currentUserId={user.id}
                  likers={
                    likesByPost
                      .get(post.id)
                      ?.map((userId) => likerProfileMap.get(userId))
                      .filter(
                        (profile): profile is { id: string; name: string | null; avatar_url: string | null } =>
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
          <DashboardSidebar />
        </div>
      </div>
    </>
  );
}

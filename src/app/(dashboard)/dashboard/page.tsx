import { createClient } from "@/lib/supabase/server";
import { CreatePostForm } from "@/components/feed/create-post-form";
import { PostCard } from "@/components/feed/post-card";
import { DashboardRealtime } from "@/components/feed/dashboard-realtime";

const POSTS_PAGE_SIZE = 20;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: posts } = await supabase
    .from("posts")
    .select("id, user_id, content, image_url, created_at")
    .order("created_at", { ascending: false })
    .limit(POSTS_PAGE_SIZE);

  if (!posts?.length) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <CreatePostForm userId={user.id} />
        <div className="rounded-2xl border border-border/80 bg-card p-8 text-center text-muted-foreground shadow-sm">
          <p className="font-medium">No posts yet</p>
          <p className="text-sm">Be the first to share something.</p>
        </div>
      </div>
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

  return (
    <>
      <DashboardRealtime />
      <div className="space-y-4 sm:space-y-6">
        <CreatePostForm userId={user.id} />
        <ul className="space-y-4">
          {posts.map((post) => (
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
                    ?.map((userId) => likerProfileMap.get(userId))
                    .filter(
                      (profile): profile is { name: string | null; avatar_url: string | null } =>
                        profile !== undefined
                    ) ?? []
                }
              />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

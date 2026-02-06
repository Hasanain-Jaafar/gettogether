import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostCard } from "@/components/feed/post-card";

function getInitials(name: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatJoinDate(created_at: string): string {
  return new Date(created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  if (!currentUser) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, bio, avatar_url, created_at")
    .eq("id", userId)
    .single();

  if (!profile) notFound();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, user_id, content, image_url, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const postIds = posts?.map((p) => p.id) ?? [];
  const { data: likes } = await supabase
    .from("likes")
    .select("post_id, user_id")
    .in("post_id", postIds);
  const likeCountMap = new Map<string, number>();
  const userLikedSet = new Set<string>();
  likes?.forEach((l) => {
    likeCountMap.set(l.post_id, (likeCountMap.get(l.post_id) ?? 0) + 1);
    if (l.user_id === currentUser.id) userLikedSet.add(l.post_id);
  });

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
  type CommentWithAuthor = {
    id: string;
    post_id: string;
    content: string;
    created_at: string;
    user_id: string;
    author: { name: string | null; avatar_url: string | null } | null;
  };
  const commentsByPost = new Map<string, CommentWithAuthor[]>();
  comments?.forEach((c) => {
    const list = commentsByPost.get(c.post_id) ?? [];
    list.push({ ...c, author: commentProfileMap.get(c.user_id) ?? null });
    commentsByPost.set(c.post_id, list);
  });
  const commentCountMap = new Map<string, number>();
  comments?.forEach((c) =>
    commentCountMap.set(c.post_id, (commentCountMap.get(c.post_id) ?? 0) + 1)
  );

  const isOwnProfile = currentUser.id === userId;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Avatar className="size-20 shrink-0">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-2xl">
              {getInitials(profile.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h1 className="text-xl font-semibold text-foreground">
              {profile.name ?? "Someone"}
            </h1>
            {profile.bio && (
              <p className="mt-1 text-muted-foreground">{profile.bio}</p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              Joined {formatJoinDate(profile.created_at)}
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {posts?.length ?? 0} post{(posts?.length ?? 0) !== 1 ? "s" : ""}
            </p>
            {isOwnProfile && (
              <Button asChild className="mt-4 rounded-xl" variant="outline">
                <Link href="/profile">Edit profile</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {!posts?.length ? (
        <div className="rounded-2xl border border-border/80 bg-card p-8 text-center text-muted-foreground shadow-sm">
          <p>No posts yet.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard
                post={post}
                author={{ name: profile.name, avatar_url: profile.avatar_url }}
                likeCount={likeCountMap.get(post.id) ?? 0}
                commentCount={commentCountMap.get(post.id) ?? 0}
                currentUserLiked={userLikedSet.has(post.id)}
                comments={commentsByPost.get(post.id) ?? []}
                currentUserId={currentUser.id}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

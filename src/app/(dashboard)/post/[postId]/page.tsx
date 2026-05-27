import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/feed/post-card";

export default async function PostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: post } = await supabase
    .from("posts")
    .select("id, user_id, content, image_url, created_at")
    .eq("id", postId)
    .maybeSingle();

  if (!post) notFound();

  const { data: author } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .eq("id", post.user_id)
    .maybeSingle();

  const [
    { data: likes },
    { data: comments },
    { data: bookmarks },
    { data: reposts },
  ] = await Promise.all([
    supabase.from("likes").select("user_id").eq("post_id", postId),
    supabase
      .from("comments")
      .select("id, post_id, content, created_at, user_id")
      .eq("post_id", postId)
      .order("created_at", { ascending: true }),
    supabase.from("bookmarks").select("user_id").eq("post_id", postId),
    supabase.from("reposts").select("user_id").eq("post_id", postId),
  ]);

  const commentUserIds = [...new Set(comments?.map((c) => c.user_id) ?? [])];
  const likerUserIds = [...new Set(likes?.map((l) => l.user_id) ?? [])];
  const allProfileIds = [...new Set([...commentUserIds, ...likerUserIds])];
  const { data: profiles } = allProfileIds.length
    ? await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", allProfileIds)
    : { data: [] };
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

  const commentsWithAuthors =
    comments?.map((c) => ({
      ...c,
      author: profileMap.get(c.user_id) ?? null,
    })) ?? [];

  const likers =
    likes
      ?.map((l) => profileMap.get(l.user_id))
      .filter(
        (p): p is { id: string; name: string | null; avatar_url: string | null } =>
          p !== undefined
      )
      .map(({ name, avatar_url }) => ({ name, avatar_url })) ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>
      <PostCard
        post={post}
        author={author ?? { name: null, avatar_url: null }}
        likeCount={likes?.length ?? 0}
        commentCount={comments?.length ?? 0}
        bookmarkCount={bookmarks?.length ?? 0}
        repostCount={reposts?.length ?? 0}
        currentUserLiked={likes?.some((l) => l.user_id === user.id) ?? false}
        currentUserBookmarked={
          bookmarks?.some((b) => b.user_id === user.id) ?? false
        }
        currentUserReposted={
          reposts?.some((r) => r.user_id === user.id) ?? false
        }
        comments={commentsWithAuthors}
        currentUserId={user.id}
        likers={likers}
      />
    </div>
  );
}

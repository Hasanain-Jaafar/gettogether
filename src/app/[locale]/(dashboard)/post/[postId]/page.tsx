import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { PostCard } from "@/components/feed/post-card";
import { safeInternalPath } from "@/lib/safe-path";

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; postId: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { locale, postId } = await params;
  // Set by links that know where the user came from (e.g. profile grid tiles).
  const returnTo = safeInternalPath((await searchParams).returnTo);
  setRequestLocale(locale);
  const t = await getTranslations("postPage");
  const supabase = await createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) return null;

  // Likes and comments only need the post id from the URL, so they're fetched
  // alongside the post instead of waiting for it.
  const [{ data: post }, { data: likes }, { data: comments }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, user_id, content, image_url, image_width, image_height, video_url, video_orientation, created_at, category")
      .eq("id", postId)
      .maybeSingle(),
    supabase.from("likes").select("user_id").eq("post_id", postId),
    supabase
      .from("comments")
      .select("id, post_id, content, created_at, user_id, parent_id")
      .eq("post_id", postId)
      .order("created_at", { ascending: true }),
  ]);

  if (!post) notFound();

  // Second round: everything that depends on the rows above. The author is looked
  // up together with commenters and likers in a single profiles query.
  const commentUserIds = comments?.map((c) => c.user_id) ?? [];
  const likerUserIds = likes?.map((l) => l.user_id) ?? [];
  const allProfileIds = [...new Set([post.user_id, ...commentUserIds, ...likerUserIds])];
  const commentIds = comments?.map((c) => c.id) ?? [];
  const [{ data: profiles }, { data: commentLikes }] = await Promise.all([
    supabase.from("profiles").select("id, name, avatar_url").in("id", allProfileIds),
    commentIds.length
      ? supabase.from("comment_likes").select("comment_id, user_id").in("comment_id", commentIds)
      : Promise.resolve({ data: [] as { comment_id: string; user_id: string }[] }),
  ]);
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);
  const author = profileMap.get(post.user_id);
  const commentLikeCount = new Map<string, number>();
  const commentLikedByMe = new Set<string>();
  commentLikes?.forEach((l) => {
    commentLikeCount.set(l.comment_id, (commentLikeCount.get(l.comment_id) ?? 0) + 1);
    if (l.user_id === user.id) commentLikedByMe.add(l.comment_id);
  });

  const commentsWithAuthors =
    comments?.map((c) => ({
      ...c,
      author: profileMap.get(c.user_id) ?? null,
      like_count: commentLikeCount.get(c.id) ?? 0,
      liked_by_me: commentLikedByMe.has(c.id),
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
        href={returnTo ?? "/dashboard"}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4 rtl:hidden" />
        <ArrowRight className="size-4 ltr:hidden" />
        {t("back")}
      </Link>
      <PostCard
        post={post}
        author={author ?? { name: null, avatar_url: null }}
        likeCount={likes?.length ?? 0}
        commentCount={comments?.length ?? 0}
        currentUserLiked={likes?.some((l) => l.user_id === user.id) ?? false}
        comments={commentsWithAuthors}
        currentUserId={user.id}
        likers={likers}
        // Once deleted this page would 404, so go back where the user came from (or their profile).
        afterDeleteHref={returnTo ?? `/u/${user.id}`}
        priority
      />
    </div>
  );
}

import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostCard } from "@/components/feed/post-card";
import { getFollowers, getFollowing } from "@/app/[locale]/(dashboard)/actions/follows";
import { FollowButton } from "@/components/profile/follow-button";
import { MessageButton } from "@/components/messages/message-button";
import { FollowListDialog } from "@/components/profile/follow-list-dialog";
import {
  MapPin,
  Calendar,
  Hash,
  Globe,
  Heart,
} from "lucide-react";

function getInitials(name: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatJoinDate(created_at: string, locale: string): string {
  return new Date(created_at).toLocaleDateString(locale === "ar" ? "ar" : "en-US", {
    month: "long",
    year: "numeric",
  });
}

function calculateAge(birthday: string): number | null {
  if (!birthday) return null;
  const birth = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function formatBirthday(birthday: string, locale: string): string {
  const date = new Date(birthday);
  return date.toLocaleDateString(locale === "ar" ? "ar" : "en-US", {
    month: "long",
    day: "numeric",
  });
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ locale: string; userId: string }>;
}) {
  const { locale, userId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("profile");
  const tFeed = await getTranslations("feed");
  const tSidebar = await getTranslations("sidebar");
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  if (!currentUser) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
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
    .select("id, post_id, content, created_at, user_id, parent_id")
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

  const commentIds = comments?.map((c) => c.id) ?? [];
  const { data: commentLikes } = commentIds.length
    ? await supabase
        .from("comment_likes")
        .select("comment_id, user_id")
        .in("comment_id", commentIds)
    : { data: [] as { comment_id: string; user_id: string }[] };
  const commentLikeCount = new Map<string, number>();
  const commentLikedByMe = new Set<string>();
  commentLikes?.forEach((l) => {
    commentLikeCount.set(l.comment_id, (commentLikeCount.get(l.comment_id) ?? 0) + 1);
    if (l.user_id === currentUser.id) commentLikedByMe.add(l.comment_id);
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
      author: commentProfileMap.get(c.user_id) ?? null,
      like_count: commentLikeCount.get(c.id) ?? 0,
      liked_by_me: commentLikedByMe.has(c.id),
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
    if (b.user_id === currentUser.id) userBookmarkedSet.add(b.post_id);
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
    if (r.user_id === currentUser.id) userRepostedSet.add(r.post_id);
  });

  // Get followers and following
  const followers = await getFollowers(userId);
  const following = await getFollowing(userId);

  const isOwnProfile = currentUser.id === userId;

  let isFollowing = false;
  if (!isOwnProfile) {
    const { data: followRow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUser.id)
      .eq("following_id", userId)
      .maybeSingle();
    isFollowing = !!followRow;
  }

  return (
    <div className="space-y-6">
      {/* Followers / Following Stats */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <FollowListDialog label={t("followers")} users={followers} />
          <FollowListDialog label={t("following")} users={following} />
        </div>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col items-center gap-4 sm:w-auto">
            <Avatar className="size-24">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-3xl">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Profile Details */}
          <div className="flex-1 space-y-4 text-center sm:text-left">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {profile.name ?? tFeed("post.someone")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("joined", { date: formatJoinDate(profile.created_at, locale) })}
              </p>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="flex items-start gap-2">
                <Heart className="size-4 shrink-0 mt-1 text-primary" />
                <p className="text-sm text-foreground">{profile.bio}</p>
              </div>
            )}

            {/* Location */}
            {profile.location && profile.show_location && (
              <div className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0 text-primary" />
                <span className="text-sm text-foreground">{profile.location}</span>
              </div>
            )}

            {/* Birthday/Age */}
            {profile.birthday && (profile.show_birthday || profile.show_age) && (
              <div className="flex items-center gap-2">
                <Calendar className="size-4 shrink-0 text-primary" />
                <span className="text-sm text-foreground">
                  {profile.show_birthday
                    ? formatBirthday(profile.birthday, locale)
                    : null}
                  {profile.show_birthday && profile.show_age
                    ? " • "
                    : null}
                  {profile.show_age
                    ? t("agePreview", { age: calculateAge(profile.birthday) ?? 0 }).replace(/^.*?: /, "")
                    : null}
                </span>
              </div>
            )}

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Hash className="size-4 shrink-0 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {t("interestsSection")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest: string) => (
                    <span
                      key={interest}
                      className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1.5 text-xs text-primary"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Website */}
            {profile.website && (
              <div className="flex items-center gap-2">
                <Globe className="size-4 shrink-0 text-primary" />
                <Link
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {profile.website.replace(/^https?:\/\//, "")}
                </Link>
              </div>
            )}

            {/* Relationship Status */}
            {profile.relationship_status && (
              <div className="flex items-center gap-2">
                <Heart className="size-4 shrink-0 text-primary" />
                <span className="text-sm text-foreground">
                  {profile.relationship_status}
                </span>
              </div>
            )}

            {/* Edit / Follow Button */}
            {isOwnProfile ? (
              <Button asChild className="rounded-full" variant="outline">
                <Link href="/profile">{t("editProfile")}</Link>
              </Button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <FollowButton
                  targetUserId={userId}
                  initialFollowing={isFollowing}
                />
                <MessageButton targetUserId={userId} />
              </div>
            )}

            {/* Stats */}
            <div className="text-sm">
              <p className="font-medium text-foreground">
                {tSidebar("postCount", { count: posts?.length ?? 0 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      {!posts?.length ? (
        <div className="rounded-2xl border border-border/80 bg-card p-8 text-center text-muted-foreground shadow-sm">
          <p>{tFeed("empty.noPostsTitle")}</p>
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
                bookmarkCount={bookmarkCountMap.get(post.id) ?? 0}
                repostCount={repostCountMap.get(post.id) ?? 0}
                currentUserLiked={userLikedSet.has(post.id)}
                currentUserBookmarked={userBookmarkedSet.has(post.id)}
                currentUserReposted={userRepostedSet.has(post.id)}
                comments={commentsByPost.get(post.id) ?? []}
                currentUserId={currentUser.id}
                likers={[]}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

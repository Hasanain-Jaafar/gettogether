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
import { LevelBadge } from "@/components/profile/level-badge";
import { BadgeGrid, type BadgeRow } from "@/components/profile/badge-grid";
import { LeveledAvatar } from "@/components/profile/leveled-avatar";
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

  const userXp: number = profile.xp ?? 0;
  const userLevel: number = profile.level ?? 1;
  const xpForCurrent = (userLevel - 1) * (userLevel - 1) * 50;
  const xpForNext = userLevel * userLevel * 50;
  const xpProgress = Math.min(
    100,
    Math.max(
      0,
      Math.round(((userXp - xpForCurrent) / Math.max(1, xpForNext - xpForCurrent)) * 100),
    ),
  );

  const { data: userBadgesRaw } = await supabase
    .from("user_badges")
    .select("badge_key, badges(key, name, description, icon, tier)")
    .eq("user_id", userId)
    .order("awarded_at", { ascending: false });
  const userBadges: BadgeRow[] = (userBadgesRaw ?? [])
    .map((row: { badges: BadgeRow | BadgeRow[] | null }) => {
      const b = Array.isArray(row.badges) ? row.badges[0] : row.badges;
      return b ?? null;
    })
    .filter((b): b is BadgeRow => b != null);

  const { data: posts } = await supabase
    .from("posts")
    .select("id, user_id, content, image_url, video_url, created_at")
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
            <LeveledAvatar level={userLevel} className="size-24">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-3xl">
                {getInitials(profile.name)}
              </AvatarFallback>
            </LeveledAvatar>
          </div>

          {/* Profile Details */}
          <div className="flex-1 space-y-4 text-center sm:text-left">
            <div>
              <h1 className="flex items-center justify-center gap-2 text-2xl font-semibold text-foreground sm:justify-start">
                {profile.name ?? tFeed("post.someone")}
                <LevelBadge level={userLevel} />
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("joined", { date: formatJoinDate(profile.created_at, locale) })}
              </p>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t("xpProgress", { current: userXp, next: xpForNext })}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>
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

      {/* Badges */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground">
          {t("badges")}
        </h2>
        <BadgeGrid badges={userBadges} emptyLabel={t("noBadges")} />
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
                author={{ name: profile.name, avatar_url: profile.avatar_url, level: profile.level }}
                likeCount={likeCountMap.get(post.id) ?? 0}
                commentCount={commentCountMap.get(post.id) ?? 0}
                currentUserLiked={userLikedSet.has(post.id)}
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

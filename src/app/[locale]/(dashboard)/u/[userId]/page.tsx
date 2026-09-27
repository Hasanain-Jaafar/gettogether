import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostGrid, isVideoPost } from "@/components/profile/post-grid";
import { FollowButton } from "@/components/profile/follow-button";
import { ScrollToTop } from "@/components/feed/scroll-to-top";
import {
  MapPin,
  Calendar,
  Hash,
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
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await getUser();
  if (!currentUser) return null;

  const isOwnProfile = currentUser.id === userId;

  // None of these depend on each other — fetch them all together instead of
  // waiting on each round trip in sequence.
  const [
    { data: profile },
    { data: posts },
    followRow,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase
      .from("posts")
      .select("id, content, image_url, video_url, category")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    isOwnProfile
      ? Promise.resolve(null)
      : supabase
          .from("follows")
          .select("id")
          .eq("follower_id", currentUser.id)
          .eq("following_id", userId)
          .maybeSingle()
          .then((r) => r.data),
  ]);

  if (!profile) notFound();

  const isFollowing = !!followRow;

  const songCount = posts?.filter((p) => p.category === "songs").length ?? 0;
  const imageCount = posts?.filter((p) => p.category === "images").length ?? 0;
  const videoCount = posts?.filter(isVideoPost).length ?? 0;

  return (
    <div className="space-y-6">
      <ScrollToTop />
      {/* Profile Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-6">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="size-24">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-3xl">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Profile Details */}
          {/* Every row is centered: the column centers its children, and text inside them is centered too */}
          <div className="flex w-full flex-col items-center gap-4 text-center">
            <div>
              <h1 className="flex items-center justify-center gap-2 text-2xl font-semibold text-foreground">
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
                <div className="flex items-center justify-center gap-2">
                  <Hash className="size-4 shrink-0 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {t("interestsSection")}
                  </span>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
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
              <div className="flex flex-wrap justify-center gap-2">
                <FollowButton
                  targetUserId={userId}
                  initialFollowing={isFollowing}
                />
              </div>
            )}

            {/* Stats */}
            <div className="text-sm">
              <p className="font-medium text-foreground">
                {[
                  t("songsCount", { count: songCount }),
                  t("imagesCount", { count: imageCount }),
                  t("videosCount", { count: videoCount }),
                ].join(" · ")}
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
        <PostGrid posts={posts} />
      )}
    </div>
  );
}

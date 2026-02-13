import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostCard } from "@/components/feed/post-card";
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

function formatJoinDate(created_at: string): string {
  return new Date(created_at).toLocaleDateString("en-US", {
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

function formatBirthday(birthday: string): string {
  const date = new Date(birthday);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
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

  const isOwnProfile = currentUser.id === userId;

  return (
    <div className="space-y-6">
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
                {profile.name ?? "Someone"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Joined {formatJoinDate(profile.created_at)}
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
                    ? formatBirthday(profile.birthday)
                    : null}
                  {profile.show_birthday && profile.show_age
                    ? " • "
                    : null}
                  {profile.show_age
                    ? `${calculateAge(profile.birthday)} years old`
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
                    Interests
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

            {/* Edit Button */}
            {isOwnProfile && (
              <Button asChild className="rounded-full" variant="outline">
                <Link href="/profile">Edit profile</Link>
              </Button>
            )}

            {/* Stats */}
            <div className="text-sm">
              <p className="font-medium text-foreground">
                {posts?.length ?? 0} post{(posts?.length ?? 0) !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
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

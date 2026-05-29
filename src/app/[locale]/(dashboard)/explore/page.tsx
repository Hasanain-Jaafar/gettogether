import { Hash, Search, Users } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { SearchInput } from "@/components/explore/search-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { relativeTime } from "@/lib/utils";
import { getTrendingTopics } from "@/app/[locale]/(dashboard)/actions/hashtags";
import { TrendingSidebar } from "@/components/feed/trending-sidebar";
import { linkifyHashtags } from "@/lib/linkify-hashtags";

function escapeIlike(input: string) {
  return input.replace(/[\\%_]/g, (m) => `\\${m}`);
}

function initials(name: string | null) {
  if (!name?.trim()) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default async function ExplorePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { q: qParam } = await searchParams;
  const q = (qParam ?? "").trim();
  const t = await getTranslations("explore");
  const supabase = await createClient();

  const hashtagQuery = q.startsWith("#") ? q.slice(1).trim() : "";
  const isHashtagSearch = hashtagQuery.length > 0;

  let people: Array<{
    id: string;
    name: string | null;
    avatar_url: string | null;
    bio: string | null;
  }> = [];
  let posts: Array<{
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    image_url: string | null;
    video_url: string | null;
  }> = [];
  let postAuthors = new Map<
    string,
    { name: string | null; avatar_url: string | null }
  >();
  let trending: Array<{ name: string; count: number; last_trending_at: string }> = [];

  if (isHashtagSearch) {
    const pattern = `%#${escapeIlike(hashtagQuery)}%`;
    const { data: postsRes } = await supabase
      .from("posts")
      .select("id, user_id, content, created_at, image_url, video_url")
      .ilike("content", pattern)
      .order("created_at", { ascending: false })
      .limit(20);
    posts = postsRes ?? [];
  } else if (q) {
    const pattern = `%${escapeIlike(q)}%`;
    const [peopleRes, postsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, name, avatar_url, bio")
        .ilike("name", pattern)
        .limit(20),
      supabase
        .from("posts")
        .select("id, user_id, content, created_at, image_url, video_url")
        .ilike("content", pattern)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    people = peopleRes.data ?? [];
    posts = postsRes.data ?? [];
  } else {
    trending = await getTrendingTopics(10);
  }

  const authorIds = [...new Set(posts.map((p) => p.user_id))];
  if (authorIds.length) {
    const { data: authors } = await supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .in("id", authorIds);
    postAuthors = new Map(authors?.map((a) => [a.id, a]) ?? []);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <SearchInput />

      {!q ? (
        <div className="space-y-6">
          {trending.length > 0 && <TrendingSidebar trending={trending} />}
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
                <Search className="size-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">{t("startSearching")}</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {t("startSearchingDescription")}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : people.length === 0 && posts.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
              <Search className="size-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">{t("noResults", { query: q })}</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {t("noResultsHint")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {!isHashtagSearch && people.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("people")}
                </h2>
              </div>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {people.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/u/${p.id}`}
                      className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card p-3 transition-shadow hover:shadow-md"
                    >
                      <Avatar className="size-12">
                        <AvatarImage
                          src={p.avatar_url ?? undefined}
                          alt={p.name ?? ""}
                        />
                        <AvatarFallback>{initials(p.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          {p.name ?? "Unnamed"}
                        </p>
                        {p.bio && (
                          <p className="truncate text-sm text-muted-foreground">
                            {p.bio}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {posts.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                {isHashtagSearch ? (
                  <Hash className="size-4 text-muted-foreground" />
                ) : (
                  <Search className="size-4 text-muted-foreground" />
                )}
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {isHashtagSearch
                    ? t("hashtagResults", { tag: hashtagQuery })
                    : t("posts")}
                </h2>
              </div>
              <ul className="space-y-3">
                {posts.map((post) => {
                  const author = postAuthors.get(post.user_id);
                  return (
                    <li key={post.id}>
                      <Card className="rounded-2xl">
                        <CardContent className="space-y-3 p-4">
                          <Link
                            href={`/u/${post.user_id}`}
                            className="flex items-center gap-2"
                          >
                            <Avatar className="size-8">
                              <AvatarImage
                                src={author?.avatar_url ?? undefined}
                                alt={author?.name ?? ""}
                              />
                              <AvatarFallback className="text-xs">
                                {initials(author?.name ?? null)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">
                                {author?.name ?? "Someone"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {relativeTime(post.created_at, locale)}
                              </p>
                            </div>
                          </Link>
                          <p className="whitespace-pre-wrap wrap-break-word text-sm">
                            {linkifyHashtags(post.content)}
                          </p>
                          {post.image_url && (
                            <div className="overflow-hidden rounded-xl bg-muted">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={post.image_url}
                                alt=""
                                loading="lazy"
                                className="mx-auto block h-auto max-h-80 w-full object-contain"
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

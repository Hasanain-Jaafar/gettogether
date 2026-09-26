import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getUser } from "@/lib/supabase/server";
import { CreatePostForm } from "@/components/feed/create-post-form";
import { PostCard } from "@/components/feed/post-card";
import { DashboardRealtime } from "@/components/feed/dashboard-realtime";
import { ScrollToTop } from "@/components/feed/scroll-to-top";
import { DashboardSidebar } from "@/components/feed/dashboard-sidebar";
import { EmptyState } from "@/components/feed/empty-state";
import { LoadMorePosts } from "@/components/feed/load-more-posts";
import { loadFeedPage } from "@/lib/feed-page";
import { getWhoToFollow } from "@/app/[locale]/(dashboard)/actions/follows";
import { CategoryFilterBar } from "@/components/feed/category-filter-bar";
import { isPostCategory, type PostCategory } from "@/lib/post-categories";

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ hashtag?: string; category?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tSidebar = await getTranslations("sidebar");
  const tFeed = await getTranslations("feed.empty");
  const { hashtag: hashtagParam, category: categoryParam } = await searchParams;
  const {
    data: { user },
  } = await getUser();
  if (!user) return null;
  const userId = user.id;

  const hashtag = hashtagParam;
  const category: PostCategory | null = isPostCategory(categoryParam) ? categoryParam : null;

  // These two don't depend on each other — fetch them together instead of waiting in sequence.
  const [whoToFollowInitial, feedPage] = await Promise.all([
    getWhoToFollow(userId, 3),
    loadFeedPage(userId, { hashtag, category }),
  ]);

  if (!feedPage.items.length) {
    return (
      <>
        <DashboardRealtime />
        <ScrollToTop />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            <CreatePostForm userId={user.id} />
            <CategoryFilterBar active={category} />
            <EmptyState
              type={category ? "no-results" : "welcome"}
              actionLabel={category ? undefined : tFeed("createFirst")}
              actionTarget={category ? undefined : "focus-create-post"}
            />
          </div>
          <div className="lg:col-span-1 hidden lg:block">
            <DashboardSidebar
              whoToFollowInitial={whoToFollowInitial}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardRealtime />
      <ScrollToTop />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          <CreatePostForm userId={user.id} />
          <CategoryFilterBar active={category} />
          {hashtag && (
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">#{hashtag}</h2>
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {tSidebar("clearFilter")}
              </Link>
            </div>
          )}
          <ul className="space-y-4">
            {feedPage.items.map((item) => (
              <li key={item.post.id}>
                <PostCard {...item} />
              </li>
            ))}
          </ul>
          <LoadMorePosts
            key={`${hashtag ?? ""}|${category ?? ""}`}
            initialCursor={feedPage.nextCursor}
            initialHasMore={feedPage.hasMore}
            hashtag={hashtag}
            category={category}
            excludeIds={feedPage.items.map((item) => item.post.id)}
          />
        </div>
        <div className="lg:col-span-1 hidden lg:block">
          <DashboardSidebar
            whoToFollowInitial={whoToFollowInitial}
          />
        </div>
      </div>
    </>
  );
}

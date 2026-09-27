"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PostCard, type PostCardProps } from "@/components/feed/post-card";
import { loadMoreFeedPosts } from "@/app/[locale]/(dashboard)/actions/feed";

// Renders the posts after the server-rendered first page, fetching the next
// page each time the button is pressed until the feed runs out.
export function LoadMorePosts({
  initialCursor,
  initialHasMore,
  hashtag,
  category,
  excludeIds,
}: {
  initialCursor: string | null;
  initialHasMore: boolean;
  hashtag?: string | null;
  category?: string | null;
  excludeIds: string[];
}) {
  const t = useTranslations("feed.loadMore");
  const [items, setItems] = useState<PostCardProps[]>([]);
  const [cursor, setCursor] = useState(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    if (!cursor) return;
    startTransition(async () => {
      try {
        const page = await loadMoreFeedPosts({ hashtag, category }, cursor);
        setItems((prev) => {
          const seen = new Set([...excludeIds, ...prev.map((i) => i.post.id)]);
          return [...prev, ...page.items.filter((i) => !seen.has(i.post.id))];
        });
        setCursor(page.nextCursor);
        setHasMore(page.hasMore);
      } catch {
        toast.error(t("failed"));
      }
    });
  }

  return (
    <>
      {items.length > 0 && (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.post.id}>
              <PostCard {...item} />
            </li>
          ))}
        </ul>
      )}
      {hasMore ? (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={isPending}>
            {isPending && <Spinner />}
            {isPending ? t("loading") : t("button")}
          </Button>
        </div>
      ) : (
        items.length > 0 && (
          <p className="text-center text-sm text-muted-foreground">{t("end")}</p>
        )
      )}
    </>
  );
}

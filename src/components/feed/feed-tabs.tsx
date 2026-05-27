"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

type FeedTab = "foryou" | "following";

export function FeedTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("feed.tabs");
  const currentTab = (searchParams.get("tab") as FeedTab) || "foryou";

  const setTab = (tab: FeedTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl">
      <Button
        variant={currentTab === "foryou" ? "default" : "ghost"}
        size="sm"
        onClick={() => setTab("foryou")}
        className="rounded-lg gap-2"
      >
        <Sparkles className="size-4" />
        {t("forYou")}
      </Button>
      <Button
        variant={currentTab === "following" ? "default" : "ghost"}
        size="sm"
        onClick={() => setTab("following")}
        className="rounded-lg gap-2"
      >
        <Users className="size-4" />
        {t("following")}
      </Button>
    </div>
  );
}

export type { FeedTab };

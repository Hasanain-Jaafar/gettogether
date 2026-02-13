import { useState, useEffect } from "react";

type FeedLayout = "list" | "compact" | "grid";

const STORAGE_KEY = "feed-layout-preference";

export function useFeedLayout(): {
  layout: FeedLayout;
  setLayout: (layout: FeedLayout) => void;
  toggleLayout: () => void;
} {
  const [layout, setLayoutState] = useState<FeedLayout>(() => {
    if (typeof window === "undefined") return "list";

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return (stored as FeedLayout) || "list";
    } catch {
      return "list";
    }
  });

  const setLayout = (newLayout: FeedLayout) => {
    setLayoutState(newLayout);
    try {
      localStorage.setItem(STORAGE_KEY, newLayout);
    } catch {
      // Ignore localStorage errors
    }
  };

  const toggleLayout = () => {
    const layouts: FeedLayout[] = ["list", "compact", "grid"];
    const currentIndex = layouts.indexOf(layout);
    const nextLayout = layouts[(currentIndex + 1) % layouts.length];
    setLayout(nextLayout);
  };

  return { layout, setLayout, toggleLayout };
}

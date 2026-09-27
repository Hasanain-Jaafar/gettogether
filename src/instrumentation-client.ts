import { startNavigationProgress } from "@/lib/navigation-progress";

// Called by Next.js whenever a client-side navigation starts: <Link> taps,
// router.push/replace, and back/forward.
export function onRouterTransitionStart(url: string) {
  const next = new URL(url, window.location.href);
  // Same page (or hash-only change): the route won't change, so nothing would finish the bar.
  if (next.pathname === window.location.pathname && next.search === window.location.search) return;
  startNavigationProgress();
}

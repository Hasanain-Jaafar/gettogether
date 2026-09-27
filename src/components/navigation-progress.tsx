"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { NAVIGATION_PROGRESS_START, startNavigationProgress } from "@/lib/navigation-progress";

// Navigation starts are reported by onRouterTransitionStart in src/instrumentation-client.ts.
// Call startNavigationProgress() yourself only when there's async work before a router.push().
export { startNavigationProgress };

function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState<number | null>(null);
  const timers = useRef<{ show?: number; trickle?: number; hide?: number; safety?: number }>({});

  function clearTimers() {
    const t = timers.current;
    window.clearTimeout(t.show);
    window.clearInterval(t.trickle);
    window.clearTimeout(t.hide);
    window.clearTimeout(t.safety);
    timers.current = {};
  }

  function done() {
    const wasActive = timers.current.show !== undefined || timers.current.trickle !== undefined;
    clearTimers();
    if (!wasActive) return;
    setProgress((p) => (p === null ? null : 1));
    timers.current.hide = window.setTimeout(() => setProgress(null), 250);
  }

  function start() {
    // Already running (e.g. startNavigationProgress() followed by router.push()): keep going.
    if (timers.current.show !== undefined) return;
    clearTimers();
    // Short delay so instant (prefetched) navigations don't flash the bar.
    timers.current.show = window.setTimeout(() => {
      setProgress(0.1);
      timers.current.trickle = window.setInterval(() => {
        // Ease toward 90% without ever reaching it until the route actually commits.
        setProgress((p) => (p === null ? p : p + (0.9 - p) * 0.1));
      }, 200);
    }, 80);
    // Never leave the bar stuck if a navigation is cancelled or fails silently.
    timers.current.safety = window.setTimeout(done, 15000);
  }

  // Route committed → finish.
  useEffect(() => {
    done();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  useEffect(() => {
    window.addEventListener(NAVIGATION_PROGRESS_START, start);
    return () => {
      window.removeEventListener(NAVIGATION_PROGRESS_START, start);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (progress === null) return null;

  return (
    <div
      role="progressbar"
      aria-label="Loading"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]"
    >
      <div
        className="h-full bg-primary shadow-[0_0_8px_var(--color-primary)] transition-[width,opacity] duration-200 ease-out"
        style={{ width: `${progress * 100}%`, opacity: progress >= 1 ? 0 : 1 }}
      />
    </div>
  );
}

export function NavigationProgress() {
  // useSearchParams needs a Suspense boundary to keep static rendering intact.
  return (
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  );
}

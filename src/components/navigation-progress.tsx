"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const START_EVENT = "navigation-progress:start";

/** Call before a programmatic router.push() so the top bar shows while the next page loads. */
export function startNavigationProgress() {
  window.dispatchEvent(new Event(START_EVENT));
}

function isInternalNavigation(e: MouseEvent): boolean {
  if (e.defaultPrevented || e.button !== 0) return false;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;

  const anchor = (e.target as Element | null)?.closest("a");
  if (!anchor || !anchor.href) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;

  const next = new URL(anchor.href, window.location.href);
  const current = window.location;
  if (next.origin !== current.origin) return false;
  // Same page (or hash-only change): Next.js won't navigate, so nothing would finish the bar.
  return next.pathname !== current.pathname || next.search !== current.search;
}

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
    // Bubble phase on document runs after React's handlers, so e.defaultPrevented is accurate.
    const onClick = (e: MouseEvent) => {
      if (isInternalNavigation(e)) start();
    };
    window.addEventListener(START_EVENT, start);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener(START_EVENT, start);
      document.removeEventListener("click", onClick);
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

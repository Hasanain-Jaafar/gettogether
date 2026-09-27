export const NAVIGATION_PROGRESS_START = "navigation-progress:start";

/** Shows the top loading bar until the next route commits (see components/navigation-progress.tsx). */
export function startNavigationProgress() {
  window.dispatchEvent(new Event(NAVIGATION_PROGRESS_START));
}

"use client";

import { useCallback, useSyncExternalStore } from "react";

// Mobile breakpoint: below Tailwind's `md` (768px).
const MOBILE_QUERY = "(max-width: 767px)";
// Below Tailwind's `lg` (1024px): phones and portrait tablets, where the
// sidebar is a drawer and two-pane screens (Inbox) show one pane at a time.
const BELOW_DESKTOP_QUERY = "(max-width: 1023px)";

/** Non-hook check for effects and callbacks (always false on the server). */
export function isMobileViewport(): boolean {
  return matchesQuery(MOBILE_QUERY);
}

/** Non-hook check below `lg` (always false on the server). */
export function isBelowDesktopViewport(): boolean {
  return matchesQuery(BELOW_DESKTOP_QUERY);
}

function matchesQuery(query: string): boolean {
  return typeof window !== "undefined" && window.matchMedia(query).matches;
}

/**
 * Whether a media query matches. On the server it is always false, so SSR
 * markup matches desktop and React re-renders with the real value right
 * after hydration (no hydration mismatch).
 */
export function useMediaQuery(query: string): boolean {
  // Stable per query; otherwise React re-subscribes on every render.
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query]
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}

/** True when the viewport is phone-sized (below `md`). */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_QUERY);
}

/** True below `lg`. */
export function useIsBelowDesktop(): boolean {
  return useMediaQuery(BELOW_DESKTOP_QUERY);
}

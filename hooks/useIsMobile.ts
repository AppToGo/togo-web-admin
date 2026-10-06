"use client";

import { useSyncExternalStore } from "react";

// Mobile breakpoint: below Tailwind's `md` (768px).
const MOBILE_QUERY = "(max-width: 767px)";

/** Non-hook check for effects and callbacks (always false on the server). */
export function isMobileViewport(): boolean {
  return typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches;
}

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/**
 * Returns true when the viewport is phone-sized. On the server it is always
 * false, so SSR markup matches desktop and React re-renders with the real
 * value right after hydration (no hydration mismatch).
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribe,
    isMobileViewport,
    () => false
  );
}

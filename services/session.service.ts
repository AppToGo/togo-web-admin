/**
 * Session Service
 *
 * Pure browser-API module for cross-layer session signaling.
 * No React, Next.js, Zustand or Axios imports — safe to import
 * from both service modules (api.service.ts) and React components.
 *
 * Usage:
 *   // Dispatch (from Axios interceptor or any non-React code)
 *   forceLogout("session_expired");
 *
 *   // Listen (from AuthProvider useEffect)
 *   window.addEventListener(SESSION_LOGOUT_EVENT, handler);
 */

export type LogoutReason = "session_expired" | "logout";

export const SESSION_LOGOUT_EVENT = "auth:force-logout" as const;

export interface SessionLogoutEventDetail {
  reason: LogoutReason;
}

/**
 * Dispatches a custom DOM event that AuthProvider listens to.
 * Replaces window.location.href redirects so that navigation
 * is handled inside the React tree (locale-aware, no full reload).
 */
export function forceLogout(reason: LogoutReason): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<SessionLogoutEventDetail>(SESSION_LOGOUT_EVENT, {
      detail: { reason },
    })
  );
}

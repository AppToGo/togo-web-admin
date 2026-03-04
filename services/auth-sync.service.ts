/**
 * Auth Sync Service
 * 
 * Global synchronization mechanism to prevent race conditions
 * between AuthProvider (session restoration) and Axios interceptor.
 * 
 * This solves the "double refresh on startup" problem:
 * - AuthProvider starts restoring session
 * - React Query fires a request simultaneously
 * - Request gets 401, interceptor tries to refresh
 * - Without this sync, we'd have TWO refresh calls
 * 
 * Solution: Shared state that both AuthProvider and interceptor can check
 */

// Global state (module-level, singleton)
let isGlobalRefreshing = false;
let globalRefreshPromise: Promise<string | null> | null = null;

interface RefreshResult {
  success: boolean;
  token: string | null;
  error?: Error;
}

/**
 * Check if a global refresh is in progress
 */
export function isRefreshInProgress(): boolean {
  return isGlobalRefreshing;
}

/**
 * Wait for the current global refresh to complete
 * Returns the new token if successful, null if failed
 */
export function waitForRefresh(): Promise<string | null> {
  if (!isGlobalRefreshing || !globalRefreshPromise) {
    return Promise.resolve(null);
  }
  return globalRefreshPromise;
}

/**
 * Start a global refresh operation
 * Only one refresh should run at a time across the entire app
 */
export function startGlobalRefresh(
  refreshFn: () => Promise<RefreshResult>
): Promise<string | null> {
  // If already refreshing, return existing promise
  if (isGlobalRefreshing && globalRefreshPromise) {
    return globalRefreshPromise;
  }

  isGlobalRefreshing = true;

  globalRefreshPromise = refreshFn()
    .then((result) => {
      if (result.success && result.token) {
        return result.token;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => {
      isGlobalRefreshing = false;
      globalRefreshPromise = null;
    });

  return globalRefreshPromise;
}

/**
 * Clear global refresh state
 * Call this on logout or when session is definitively invalid
 */
export function clearGlobalRefreshState(): void {
  isGlobalRefreshing = false;
  globalRefreshPromise = null;
}

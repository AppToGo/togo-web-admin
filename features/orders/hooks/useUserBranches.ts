/**
 * User Branches Hook
 *
 * React Query hook for fetching and managing user session data
 * including branches, business info, and user preferences.
 *
 * This hook should be called:
 * - After successful login
 * - On app initialization
 * - When session data needs to be refreshed
 *
 * @example
 * ```tsx
 * function App() {
 *   const { branches, defaultBranchId, isLoading, error } = useUserBranches();
 *
 *   if (isLoading) return <Loading />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return (
 *     <BranchSelector
 *       branches={branches}
 *       defaultBranchId={defaultBranchId}
 *     />
 *   );
 * }
 * ```
 */

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getUserSession } from "@/features/auth/services/auth.service";
import { useSessionStore } from "@/stores/session.store";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import type { SessionResponse, UserBranch } from "@/types/auth.types";

/**
 * Query key for session data
 */
export const AUTH_SESSION_KEY = ["auth-session"] as const;

/**
 * Stale time for session data (5 minutes)
 * Session data doesn't change frequently, so we cache it
 */
const SESSION_STALE_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * GC time for session data (10 minutes)
 * Keep data in cache for 10 minutes after becoming inactive
 */
const SESSION_GC_TIME = 10 * 60 * 1000; // 10 minutes

/**
 * Hook return type
 */
interface UseUserBranchesReturn {
  /** Array of branches the user has access to */
  branches: UserBranch[];
  /** ID of the default branch (from preferences or first available) */
  defaultBranchId: string | null;
  /** Business information */
  business: SessionResponse["business"] | null;
  /** Whether the session data is loading */
  isLoading: boolean;
  /** Error if session fetch failed */
  error: Error | null;
  /** Whether there's an error related to branch access */
  hasBranchAccessError: boolean;
  /** Refetch session data */
  refetch: () => Promise<unknown>;
}

/**
 * React Query hook for user session data
 *
 * Fetches session data from /auth/session endpoint and syncs it with
 * the session store. This hook is used for app initialization and
 * after login to populate branch/business context.
 *
 * Features:
 * - Caches session data for 5 minutes
 * - Automatically syncs with session store
 * - Handles error states for users without branch access
 * - Only enabled when user is authenticated
 *
 * @returns Session data and loading/error states
 */
export function useUserBranches(): UseUserBranchesReturn {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setSession = useSessionStore((state) => state.setSession);
  const clearSession = useSessionStore((state) => state.clearSession);

  const {
    data: sessionData,
    isLoading,
    error,
    refetch,
  } = useQuery<SessionResponse, Error>({
    queryKey: AUTH_SESSION_KEY,
    queryFn: getUserSession,
    staleTime: SESSION_STALE_TIME,
    gcTime: SESSION_GC_TIME,
    enabled: isAuthenticated,
    retry: (failureCount, error) => {
      // Don't retry on 401 (unauthorized) or 403 (forbidden)
      if (error instanceof Error) {
        const message = error.message;
        if (message.includes("401") || message.includes("403")) {
          return false;
        }
      }
      return failureCount < 2;
    },
  });

  // Sync session data with store when data changes
  useEffect(() => {
    if (sessionData) {
      setSession(sessionData);
    } else if (error) {
      // Clear session on error
      clearSession();
    }
  }, [sessionData, error, setSession, clearSession]);

  // Determine if there's a branch access error
  const hasBranchAccessError =
    error?.message?.includes("No branch access") ||
    error?.message?.includes("403") ||
    (sessionData?.branches.length === 0 || false);

  return {
    branches: sessionData?.branches ?? [],
    defaultBranchId: sessionData?.defaultBranchId ?? null,
    business: sessionData?.business ?? null,
    isLoading,
    error: error ?? null,
    hasBranchAccessError,
    refetch,
  };
}

/**
 * Hook to check if user has access to any branches
 * Useful for showing error states or access requests
 */
export function useHasBranchAccess(): boolean {
  const { branches, isLoading, error } = useUserBranches();
  return !isLoading && !error && branches.length > 0;
}

/**
 * Hook to get the default branch
 * Returns the default branch object or null if not available
 */
export function useDefaultBranch(): UserBranch | null {
  const { branches, defaultBranchId } = useUserBranches();

  if (!defaultBranchId || branches.length === 0) {
    return null;
  }

  return branches.find((branch) => branch.id === defaultBranchId) ?? null;
}

/**
 * Session Store
 *
 * Zustand store for managing user session context including:
 * - Branches the user has access to
 * - Default branch selection
 * - Business information
 * - User preferences
 *
 * This store is reactive and persists session data in sessionStorage
 * for quick recovery on page reloads.
 *
 * @example
 * ```tsx
 * // In a component
 * const { branches, defaultBranchId, setSession, updateDefaultBranch } = useSessionStore();
 *
 * // Set session after login
 * setSession(sessionResponse);
 *
 * // Update default branch
 * updateDefaultBranch(newBranchId);
 * ```
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { z } from "zod";
import type { SessionResponse, UserBranch } from "@/types/auth.types";

/**
 * Zod schema for validating persisted session data
 */
const SessionStorageSchema = z.object({
  state: z.object({
    branches: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        isMainBranch: z.boolean(),
        role: z.string(),
      })
    ),
    defaultBranchId: z.string().nullable(),
    business: z
      .object({
        id: z.string(),
        name: z.string(),
        plan: z.string(),
        maxBranches: z.number(),
      })
      .nullable(),
    userPreferences: z
      .object({
        defaultBranchId: z.string().nullable(),
      })
      .nullable(),
  }),
});

/**
 * Session state interface
 */
interface SessionState {
  /** Array of branches the user has access to */
  branches: UserBranch[];
  /** ID of the default branch (from user preferences) */
  defaultBranchId: string | null;
  /** Business information */
  business: SessionResponse["business"] | null;
  /** User preferences */
  userPreferences: SessionResponse["userPreferences"] | null;
  /** Whether the session has been initialized */
  isInitialized: boolean;
}

/**
 * Session actions interface
 */
interface SessionActions {
  /**
   * Set the complete session data
   * Called after successful login or when fetching session
   */
  setSession: (session: SessionResponse) => void;

  /**
   * Clear all session data
   * Called on logout or session expiration
   */
  clearSession: () => void;

  /**
   * Update the default branch preference
   * Updates both the store and optionally syncs with backend
   */
  updateDefaultBranch: (branchId: string | null) => void;

  /**
   * Check if user has access to a specific branch
   */
  hasBranchAccess: (branchId: string) => boolean;

  /**
   * Get branch by ID
   */
  getBranchById: (branchId: string) => UserBranch | undefined;

  /**
   * Mark session as initialized
   */
  setInitialized: (initialized: boolean) => void;
}

/**
 * Combined session store type
 */
type SessionStore = SessionState & SessionActions;

/**
 * Initial state for the session store
 */
const initialState: SessionState = {
  branches: [],
  defaultBranchId: null,
  business: null,
  userPreferences: null,
  isInitialized: false,
};

/**
 * Helper to safely access sessionStorage (only in browser)
 */
function getStorage() {
  if (typeof window !== "undefined") {
    return sessionStorage;
  }
  return undefined;
}

/**
 * Session Store
 *
 * Persists session data in sessionStorage with the key 'togo-session-storage'.
 * Using sessionStorage ensures data is cleared when the browser tab is closed,
 * which is appropriate for sensitive session data.
 */
export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Set complete session data from API response
       */
      setSession: (session: SessionResponse) => {
        set({
          branches: session.branches,
          defaultBranchId: session.defaultBranchId,
          business: session.business,
          userPreferences: session.userPreferences,
          isInitialized: true,
        });
      },

      /**
       * Clear all session data
       */
      clearSession: () => {
        set(initialState);
      },

      /**
       * Update the default branch preference
       * This updates the local state; API sync should be handled separately
       */
      updateDefaultBranch: (branchId: string | null) => {
        set({
          defaultBranchId: branchId,
          userPreferences: {
            ...get().userPreferences,
            defaultBranchId: branchId,
          },
        });
      },

      /**
       * Check if user has access to a specific branch
       */
      hasBranchAccess: (branchId: string): boolean => {
        return get().branches.some((branch) => branch.id === branchId);
      },

      /**
       * Get branch details by ID
       */
      getBranchById: (branchId: string): UserBranch | undefined => {
        return get().branches.find((branch) => branch.id === branchId);
      },

      /**
       * Mark session initialization state
       */
      setInitialized: (initialized: boolean) => {
        set({ isInitialized: initialized });
      },
    }),
    {
      name: "togo-session-storage",
      storage: createJSONStorage(() => getStorage() as Storage),
      // Only persist essential data
      partialize: (state) => ({
        branches: state.branches,
        defaultBranchId: state.defaultBranchId,
        business: state.business,
        userPreferences: state.userPreferences,
        isInitialized: state.isInitialized,
      }),
    }
  )
);

/**
 * Hook to get branches from session
 */
export function useSessionBranches(): UserBranch[] {
  return useSessionStore((state) => state.branches);
}

/**
 * Hook to get default branch ID from session
 */
export function useSessionDefaultBranchId(): string | null {
  return useSessionStore((state) => state.defaultBranchId);
}

/**
 * Hook to get business info from session
 */
export function useSessionBusiness(): SessionResponse["business"] | null {
  return useSessionStore((state) => state.business);
}

/**
 * Hook to check if session is initialized
 */
export function useIsSessionInitialized(): boolean {
  return useSessionStore((state) => state.isInitialized);
}

/**
 * Hook to check if user has access to a specific branch
 */
export function useHasBranchAccess(branchId: string): boolean {
  return useSessionStore((state) =>
    state.branches.some((branch) => branch.id === branchId)
  );
}

/**
 * Helper function to get session data outside of React components
 */
export function getSessionData(): Partial<SessionState> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = sessionStorage.getItem("togo-session-storage");
    if (!stored) return {};

    const parsed = JSON.parse(stored);
    const result = SessionStorageSchema.safeParse(parsed);

    if (result.success) {
      return result.data.state;
    } else {
      console.error("[SessionStore] Invalid session data:", result.error);
      sessionStorage.removeItem("togo-session-storage");
    }
  } catch {
    sessionStorage.removeItem("togo-session-storage");
  }

  return {};
}

/**
 * Helper function to get default branch ID outside of React components
 */
export function getDefaultBranchId(): string | null {
  const session = getSessionData();
  return session.defaultBranchId ?? null;
}

/**
 * Helper function to check branch access outside of React components
 */
export function hasBranchAccess(branchId: string): boolean {
  const session = getSessionData();
  return session.branches?.some((branch) => branch.id === branchId) ?? false;
}

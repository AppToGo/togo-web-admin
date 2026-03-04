/**
 * Auth Store
 * 
 * Zustand store for authentication state management
 * 
 * SECURITY MODEL:
 * - Access Token: In-memory ONLY (never persisted)
 * - Refresh Token: httpOnly cookie (managed by API routes)
 * - User data: Persisted in localStorage
 * 
 * This prevents XSS attacks from stealing tokens while maintaining
 * a good user experience.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  AuthState,
  AuthActions,
  LoginCredentials,
  LoginResponse,
  AuthenticatedUser,
} from "@/types/auth.types";
import {
  login as loginApi,
  logout as logoutApi,
  refreshTokens,
} from "@/features/auth/services/auth.service";
import { APP_CONFIG } from "@/config/app.config";

// Extended state with actions
interface AuthStore extends AuthState, AuthActions {
  shouldRefreshToken: () => boolean;
}

// Initial state - tokens are NEVER persisted
const initialState: Omit<
  AuthState,
  keyof AuthActions | "shouldRefreshToken"
> = {
  user: null,
  accessToken: null,
  refreshToken: null, // This will always be null - stored in httpOnly cookie
  expiresAt: null,
  isAuthenticated: false,
  isLoading: false,
};

/**
 * Helper to safely access localStorage (only in browser)
 */
function getStorage() {
  if (typeof window !== "undefined") {
    return localStorage;
  }
  return undefined;
}

/**
 * Auth Store
 * 
 * CRITICAL: Access token is NEVER persisted to localStorage.
 * It only exists in memory. Refresh token is in httpOnly cookie.
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Login action
       * Stores tokens securely via API route
       */
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        try {
          const response = await loginApi(credentials);
          
          // Store refresh token in httpOnly cookie via API route
          await fetch("/api/auth/set-cookie", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: response.refresh_token }),
          });

          // Store access token and user in memory only
          get().setAuthData(response);
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Logout action
       * Clears both memory state and httpOnly cookie
       */
      logout: async () => {
        try {
          // Call API to revoke token on backend
          await logoutApi("dummy"); // Backend reads from cookie
        } catch (error) {
          console.warn("Logout API error:", error);
        } finally {
          // Always clear cookie and state
          await fetch("/api/auth/clear-cookie", { method: "POST" });
          get().clearAuth();
        }
      },

      /**
       * Refresh access token using httpOnly cookie
       * 
       * This uses a lock mechanism to prevent race conditions
       * when multiple requests fail with 401 simultaneously.
       */
      refreshAccessToken: async (): Promise<boolean> => {
        try {
          // Call refresh endpoint - backend reads refresh token from cookie
          const response = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include", // Important: sends cookies
          });

          if (!response.ok) {
            throw new Error("Refresh failed");
          }

          const data: LoginResponse = await response.json();
          
          // Update in-memory state with new access token
          get().setAuthData(data);
          
          return true;
        } catch (error) {
          console.error("Token refresh failed:", error);
          get().clearAuth();
          return false;
        }
      },

      /**
       * Set auth data from login/refresh response
       * Only stores in memory - NEVER persists token
       */
      setAuthData: (data: LoginResponse) => {
        const expiresAt = Date.now() + data.expires_in * 1000;

        set({
          user: data.user,
          accessToken: data.access_token,
          refreshToken: null, // Always null - stored in cookie
          expiresAt,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      /**
       * Clear all auth data from memory
       */
      clearAuth: () => {
        set({
          ...initialState,
        });
      },

      /**
       * Check if token needs refresh
       * Returns true if token expires within buffer time
       */
      shouldRefreshToken: (): boolean => {
        const { expiresAt } = get();
        if (!expiresAt) return false;

        // Refresh if token expires in less than buffer time
        const bufferMs = APP_CONFIG.auth.tokenExpiryBuffer * 1000;
        return Date.now() >= expiresAt - bufferMs;
      },
    }),
    {
      name: "togo-auth-storage",
      storage: createJSONStorage(() => getStorage() as Storage),
      // CRITICAL: Only persist user data, NEVER tokens
      partialize: (state) => ({
        user: state.user,
        // Access token and refresh token are intentionally NOT persisted
        // accessToken: undefined,
        // refreshToken: undefined,
        // expiresAt: undefined,
        // isAuthenticated: undefined, // Will be false on page reload
      }),
    }
  )
);

/**
 * Hook to get current user
 */
export function useCurrentUser(): AuthenticatedUser | null {
  return useAuthStore((state) => state.user);
}

/**
 * Hook to check if user is authenticated
 * Note: This only returns true if access token exists in memory
 */
export function useIsAuthenticated(): boolean {
  return useAuthStore((state) => state.isAuthenticated && !!state.accessToken);
}

/**
 * Hook to check if auth is loading
 */
export function useAuthLoading(): boolean {
  return useAuthStore((state) => state.isLoading);
}

/**
 * Check if user has specific role
 */
export function useHasRole(role: string | string[]): boolean {
  const user = useCurrentUser();
  if (!user) return false;

  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  return user.role === role;
}

/**
 * Check if user belongs to a business (multi-tenant check)
 */
export function useHasBusiness(): boolean {
  const user = useCurrentUser();
  return !!user?.businessId;
}

/**
 * Get access token for API calls
 * This should only be used by the API service
 */
export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

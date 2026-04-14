"use client";

/**
 * Auth Provider
 * 
 * Handles session restoration on app initialization.
 * Critical for the in-memory access token architecture.
 * 
 * FLOW:
 * 1. Check if access token exists in memory (Zustand)
 * 2. If yes → user is authenticated, render app
 * 3. If no → check for refresh token cookie via API call
 * 4. If refresh succeeds → restore session
 * 5. If refresh fails (401/no cookie) → redirect to login
 * 
 * SYNCHRONIZATION: Uses auth-sync.service to coordinate with Axios interceptor.
 */

import { ReactNode, useEffect, useRef, useState, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "@/i18n/routing";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import {
  startGlobalRefresh,
  clearGlobalRefreshState,
  isRefreshInProgress
} from "@/services/auth-sync.service";
import {
  SESSION_LOGOUT_EVENT,
  type SessionLogoutEventDetail,
} from "@/services/session.service";
import { routing } from "@/i18n/routing";
import { useBranchStore } from "@/stores/branch.store";

type AuthRestoreState = "checking" | "authenticated" | "unauthenticated";

interface AuthContextType {
  restoreState: AuthRestoreState;
  isReady: boolean;
}

const AuthContext = createContext<AuthContextType>({
  restoreState: "checking",
  isReady: false,
});

export const useAuthContext = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password"];

export function AuthProvider({ children }: AuthProviderProps) {
  const [restoreState, setRestoreState] = useState<AuthRestoreState>("checking");
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const isRedirecting = useRef(false);
  const { accessToken, isAuthenticated, setAuthData, clearAuth } = useAuthStore();

  // Listen for force-logout events dispatched by the Axios interceptor.
  // This replaces window.location.href with a locale-aware React navigation,
  // preventing full-page reloads when a session expires mid-use.
  useEffect(() => {
    function handleForceLogout(event: Event) {
      // Idempotent: ignore if a redirect is already in progress
      if (isRedirecting.current) return;
      isRedirecting.current = true;

      const { reason } = (event as CustomEvent<SessionLogoutEventDetail>).detail;

      queryClient.clear();
      clearAuth();
      // Clear persisted branch selection so the next user starts with a clean state
      useBranchStore.getState().deselectAllBranches();

      const pathSegment = pathname?.split("/")[1];
      const locale = routing.locales.includes(pathSegment as typeof routing.locales[number])
        ? pathSegment
        : routing.defaultLocale;

      const loginPath = `/${locale}/login${reason === "session_expired" ? "?session_expired=true" : ""}`;
      router.replace(loginPath);

      // Reset the flag after navigation so future force-logout events
      // (e.g. after the component re-mounts on the login page) are not ignored
      setTimeout(() => {
        isRedirecting.current = false;
      }, 2000);
    }

    window.addEventListener(SESSION_LOGOUT_EVENT, handleForceLogout);
    return () => window.removeEventListener(SESSION_LOGOUT_EVENT, handleForceLogout);
  }, [clearAuth, pathname, queryClient, router]);

  useEffect(() => {
    // Check if current route is public
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

    // If we already have an access token in memory, we're good
    if (accessToken) {
      if (process.env.NODE_ENV === "development") {
        console.log("[AuthProvider] Access token exists in memory, authenticated");
      }
      setRestoreState("authenticated");
      return;
    }

    // If we're on a public route, don't try to restore (no loading state needed)
    if (isPublicRoute) {
      if (process.env.NODE_ENV === "development") {
        console.log("[AuthProvider] On public route, skip restore");
      }
      setRestoreState("unauthenticated");
      return;
    }

    // If a global refresh is already in progress, wait for it
    if (isRefreshInProgress()) {
      if (process.env.NODE_ENV === "development") {
        console.log("[AuthProvider] Refresh already in progress, waiting...");
      }
      return;
    }

    // Attempt to restore session
    if (process.env.NODE_ENV === "development") {
      console.log("[AuthProvider] Attempting session restore...");
    }
    
    async function restoreSession() {
      const token = await startGlobalRefresh(async () => {
        try {
          const response = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
          });

          if (response.ok) {
            const data = await response.json();
            setAuthData(data);
            if (process.env.NODE_ENV === "development") {
              console.log("[AuthProvider] Session restored successfully");
            }
            return { success: true, token: data.access_token };
          } else if (response.status === 401) {
            // No valid session (no cookie or expired)
            if (process.env.NODE_ENV === "development") {
              console.log("[AuthProvider] No valid session (401), redirecting to login");
            }
            clearAuth();
            return { success: false, token: null };
          } else {
            if (process.env.NODE_ENV === "development") {
              console.log("[AuthProvider] Refresh failed with status:", response.status);
            }
            clearAuth();
            return { success: false, token: null };
          }
        } catch (error) {
          console.error("[AuthProvider] Session restoration error:", error);
          clearAuth();
          return { 
            success: false, 
            token: null,
            error: error instanceof Error ? error : new Error("Unknown error") 
          };
        }
      });

      if (token) {
        setRestoreState("authenticated");
      } else {
        setRestoreState("unauthenticated");
        // Redirect to login with return URL (preserve locale)
        const extractedLocale = pathname?.split('/')[1];
        const locale = routing.locales.includes(extractedLocale as typeof routing.locales[number]) 
          ? extractedLocale 
          : routing.defaultLocale;
        
        // Validate redirect path to prevent open redirect attacks
        const isValidRedirect = (path: string): boolean => {
          return path.startsWith('/') && !path.startsWith('//') && !path.includes(':');
        };
        const redirectPath = pathname && isValidRedirect(pathname) ? pathname : `/${locale}/dashboard`;
        
        const loginUrl = new URL(`/${locale}/login`, window.location.origin);
        loginUrl.searchParams.set("redirect", redirectPath);
        router.replace(loginUrl.toString());
      }
    }

    restoreSession();

    // Cleanup on unmount
    return () => {
      clearGlobalRefreshState();
    };
  }, [accessToken, isAuthenticated, pathname, router, setAuthData, clearAuth]);

  // Show loading spinner only while checking on protected routes
  if (restoreState === "checking" && !PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#6366f1 transparent #6366f1 #6366f1' }} />
        </div>
      </div>
    );
  }

  const isReady = restoreState === "authenticated" || restoreState === "unauthenticated";

  return (
    <AuthContext.Provider value={{ restoreState, isReady }}>
      {children}
    </AuthContext.Provider>
  );
}

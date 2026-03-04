"use client";

/**
 * Auth Provider
 * 
 * Handles session restoration on app initialization.
 * Critical for the in-memory access token architecture:
 * - After page reload, access token is lost from memory
 * - This provider attempts to restore the session using the httpOnly cookie
 * - Shows loading state while restoring
 * 
 * SYNCHRONIZATION:
 * Uses auth-sync.service to prevent race conditions with Axios interceptor.
 * When restoring, the interceptor knows NOT to attempt its own refresh.
 */

import { ReactNode, useEffect, useState, createContext, useContext } from "react";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { 
  startGlobalRefresh, 
  clearGlobalRefreshState,
  isRefreshInProgress 
} from "@/services/auth-sync.service";

type AuthRestoreState = "idle" | "restoring" | "restored" | "failed";

interface AuthContextType {
  restoreState: AuthRestoreState;
  isReady: boolean;
}

const AuthContext = createContext<AuthContextType>({
  restoreState: "idle",
  isReady: false,
});

export const useAuthContext = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [restoreState, setRestoreState] = useState<AuthRestoreState>("idle");
  const { accessToken, isAuthenticated, setAuthData, clearAuth } = useAuthStore();

  useEffect(() => {
    // If we already have an access token in memory, no need to restore
    if (accessToken) {
      setRestoreState("restored");
      return;
    }

    // If we're already restoring globally (maybe from another tab/component), wait
    if (isRefreshInProgress()) {
      setRestoreState("restoring");
      return;
    }

    // Check if we have a refresh token cookie by attempting a refresh
    setRestoreState("restoring");

    async function restoreSession() {
      // Use global sync to prevent double refresh
      const token = await startGlobalRefresh(async () => {
        try {
          const response = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include", // Important: sends the httpOnly cookie
          });

          if (response.ok) {
            const data = await response.json();
            setAuthData(data);
            return { success: true, token: data.access_token };
          } else {
            // No valid session - cookie might be expired or invalid
            clearAuth();
            return { success: false, token: null };
          }
        } catch (error) {
          console.error("Session restoration failed:", error);
          clearAuth();
          return { 
            success: false, 
            token: null, 
            error: error instanceof Error ? error : new Error("Unknown error") 
          };
        }
      });

      // Update state based on result
      if (token) {
        setRestoreState("restored");
      } else {
        setRestoreState("failed");
      }
    }

    restoreSession();

    // Cleanup on unmount
    return () => {
      if (restoreState === "restoring") {
        clearGlobalRefreshState();
      }
    };
  }, [accessToken, isAuthenticated, setAuthData, clearAuth]);

  const isReady = restoreState === "restored" || restoreState === "failed";

  // Show loading spinner while restoring session
  if (restoreState === "restoring") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Restaurando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ restoreState, isReady }}>
      {children}
    </AuthContext.Provider>
  );
}

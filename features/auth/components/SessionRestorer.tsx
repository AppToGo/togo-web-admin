"use client";

/**
 * Session Restorer
 * 
 * This component attempts to restore the session on page reload
 * when the access token is lost from memory but the refresh token
 * cookie still exists.
 * 
 * Usage: Place this in your root layout or protected layouts
 */

import { useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useRouter } from "next/navigation";

export function SessionRestorer({ children }: { children: React.ReactNode }) {
  const [isRestoring, setIsRestoring] = useState(true);
  const { accessToken, isAuthenticated, setAuthData, clearAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // If we already have an access token, no need to restore
    if (accessToken) {
      setIsRestoring(false);
      return;
    }

    // Try to restore session using the httpOnly cookie
    async function restoreSession() {
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setAuthData(data);
        } else {
          // No valid session
          clearAuth();
        }
      } catch (error) {
        console.error("Session restoration failed:", error);
        clearAuth();
      } finally {
        setIsRestoring(false);
      }
    }

    restoreSession();
  }, [accessToken, setAuthData, clearAuth]);

  // Show loading state while restoring
  if (isRestoring && !accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin" />

        </div>
      </div>
    );
  }

  return <>{children}</>;
}

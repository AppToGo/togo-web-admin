/**
 * Auth Guard Hook
 * 
 * Client-side route protection
 * Redirects to login if user is not authenticated
 * 
 * IMPORTANT: This is a CLIENT-SIDE guard only.
 * For SSR protection, use the Next.js middleware.
 * 
 * Usage:
 *   function ProtectedPage() {
 *     useAuthGuard();
 *     return <div>Protected content</div>;
 *   }
 */

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useIsAuthenticated, useAuthLoading } from "@/features/auth/stores/auth.store";

interface UseAuthGuardOptions {
  /** Redirect to this path if not authenticated */
  redirectTo?: string;
  /** Show loading state while checking auth */
  onLoading?: () => void;
}

/**
 * Hook that redirects to login if user is not authenticated
 * Use this in pages that require authentication
 */
export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const { redirectTo = "/login", onLoading } = options;
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();

  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading) {
      onLoading?.();
      return;
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      const loginUrl = new URL(redirectTo, window.location.origin);
      // Save current path to redirect back after login
      loginUrl.searchParams.set("redirect", pathname);
      router.replace(loginUrl.toString());
    }
  }, [isAuthenticated, isLoading, pathname, redirectTo, router, onLoading]);

  return {
    isAuthenticated,
    isLoading,
    isReady: !isLoading && isAuthenticated,
  };
}

/**
 * Hook that redirects to dashboard if user IS authenticated
 * Use this in auth pages (login, register) to prevent authenticated users from accessing them
 */
export function useAuthRedirect(options: { redirectTo?: string } = {}) {
  const { redirectTo = "/dashboard" } = options;
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  return {
    isAuthenticated,
    isLoading,
    shouldShowForm: !isLoading && !isAuthenticated,
  };
}

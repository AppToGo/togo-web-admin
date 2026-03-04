/**
 * CSRF Protection Service
 * 
 * Provides utilities for CSRF token management.
 * Use this for protecting critical operations like:
 * - Payments
 * - Email/password changes
 * - Business deletion
 * - Role modifications
 */

import apiClient from "./api.service";

let csrfToken: string | null = null;
let tokenExpiry: number | null = null;

const TOKEN_LIFETIME = 55 * 60 * 1000; // 55 minutes (token expires at 60)

/**
 * Get or fetch a CSRF token
 * Returns cached token if still valid, otherwise fetches new one
 */
export async function getCsrfToken(): Promise<string> {
  // Check if we have a valid cached token
  if (csrfToken && tokenExpiry && Date.now() < tokenExpiry) {
    return csrfToken;
  }

  // Fetch new token
  const response = await fetch("/api/csrf", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch CSRF token");
  }

  const data = await response.json();
  csrfToken = data.csrfToken;
  tokenExpiry = Date.now() + TOKEN_LIFETIME;

  if (!csrfToken) {
    throw new Error("CSRF token not received");
  }

  return csrfToken;
}

/**
 * Clear the cached CSRF token
 * Call this after a protected operation or on logout
 */
export function clearCsrfToken(): void {
  csrfToken = null;
  tokenExpiry = null;
}

/**
 * Make a protected API call with CSRF token
 * Use this for critical operations
 */
export async function protectedApiCall<T>(
  method: "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  data?: unknown
): Promise<T> {
  const token = await getCsrfToken();

  const response = await apiClient.request<T>({
    method,
    url,
    data,
    headers: {
      "X-CSRF-Token": token,
    },
  });

  return response.data;
}

/**
 * Hook to check if CSRF protection is available
 * Use this to show loading states on critical action buttons
 */
export function isCsrfTokenValid(): boolean {
  return !!csrfToken && !!tokenExpiry && Date.now() < tokenExpiry;
}

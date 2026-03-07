/**
 * API Service
 * 
 * Centralized Axios instance with:
 * - JWT token attachment (from memory)
 * - Automatic token refresh with GLOBAL synchronization
 * - Error handling
 * - Multi-tenant headers
 * 
 * SECURITY: Access token is NEVER stored in localStorage
 * It only exists in memory and is lost on page reload.
 * Refresh token is in httpOnly cookie.
 * 
 * SYNCHRONIZATION: Uses auth-sync.service to coordinate with AuthProvider
 * and prevent race conditions during session restoration.
 */

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { APP_CONFIG } from "@/config/app.config";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { 
  isRefreshInProgress, 
  startGlobalRefresh,
  clearGlobalRefreshState 
} from "@/services/auth-sync.service";

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: APP_CONFIG.api.baseUrl,
  timeout: APP_CONFIG.api.timeout,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================================
// REQUEST INTERCEPTOR
// Attaches access token from memory (never from localStorage)
// ============================================================================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Skip for auth endpoints that don't need tokens
    if (
      config.url?.includes("/auth/login") ||
      config.url?.includes("/auth/refresh") ||
      config.url?.includes("/auth/logout") ||
      config.url?.includes("/api/auth/")
    ) {
      return config;
    }

    // Get access token from memory
    const { accessToken } = useAuthStore.getState();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // SECURITY: We intentionally do NOT send X-Business-ID header
    // The backend should extract businessId from the JWT only
    // This prevents potential header manipulation attacks
    // See README.md "Multi-Tenant" section for details

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================================
// RESPONSE INTERCEPTOR - Error messages extraction
// Extracts user-friendly error messages from backend response
// ============================================================================

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Extract user-friendly error message from backend response
    if (error.response?.data) {
      const data = error.response.data as any;
      // Use backend error message if available
      if (data.message && !error.message.includes("Request failed")) {
        error.message = data.message;
      } else if (data.error && !error.message.includes("Request failed")) {
        error.message = data.error;
      }
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is not 401, reject immediately
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Check if this is an auth endpoint (don't retry auth errors)
    if (
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/api/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    // If already retried, reject to prevent infinite loop
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Mark as retried
    originalRequest._retry = true;

    // ==========================================================================
    // GLOBAL SYNCHRONIZATION
    // Check if AuthProvider or another request is already refreshing
    // ==========================================================================
    
    // If a global refresh is in progress, wait for it
    if (isRefreshInProgress()) {
      try {
        // Use global sync to wait for the ongoing refresh
        const token = await startGlobalRefresh(async () => {
          // This won't actually start a new refresh if one is in progress
          // It will return the promise of the ongoing refresh
          return { success: false, token: null };
        });
        
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch {
        // Refresh failed
        useAuthStore.getState().clearAuth();
        if (typeof window !== "undefined") {
          window.location.href = "/login?session_expired=true";
        }
        return Promise.reject(error);
      }
    }

    // ==========================================================================
    // REFRESH TOKEN
    // Only one request can refresh at a time (globally)
    // ==========================================================================
    
    try {
      const token = await startGlobalRefresh(async () => {
        try {
          // Call internal API route that reads httpOnly cookie
          const response = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
          });

          if (!response.ok) {
            throw new Error("Token refresh failed");
          }

          const data = await response.json();

          // Update in-memory state
          useAuthStore.getState().setAuthData(data);

          return { success: true, token: data.access_token };
        } catch (err) {
          return { 
            success: false, 
            token: null,
            error: err instanceof Error ? err : new Error("Refresh failed")
          };
        }
      });

      if (token) {
        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } else {
        // Refresh failed
        throw new Error("Token refresh returned null");
      }
    } catch (refreshError) {
      // Clear auth state
      useAuthStore.getState().clearAuth();
      clearGlobalRefreshState();

      // Redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login?session_expired=true";
      }

      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;

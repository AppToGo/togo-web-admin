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
import { toast } from "sonner";
import { APP_CONFIG } from "@/config/app.config";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useBusinessStore } from "@/features/business/stores/business.store";
import {
  isRefreshInProgress,
  startGlobalRefresh,
  clearGlobalRefreshState
} from "@/services/auth-sync.service";
import { forceLogout } from "@/services/session.service";
// Import directly from the hook file (not the feature barrel) to avoid
// pulling UI components (dialogs, icons) into this low-level HTTP client.
import { openUpgradePlanModal } from "@/features/subscription/hooks/useUpgradePlanModal";

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: APP_CONFIG.api.baseUrl,
  timeout: APP_CONFIG.api.timeout,
  headers: {
    "Content-Type": "application/json",
  },
  // Serialize arrays without brackets (branchIds=id1&branchIds=id2 instead of branchIds[]=id1)
  paramsSerializer: (params) => {
    const searchParams = new URLSearchParams();
    
    // Use Object.keys to avoid prototype pollution
    Object.keys(params).forEach((key) => {
      const value = params[key];
      
      if (Array.isArray(value)) {
        // Validate each element is a string/number before appending
        value.forEach((item) => {
          if (item !== undefined && item !== null) {
            searchParams.append(key, String(item));
          }
        });
      } else if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    
    return searchParams.toString();
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
    const { accessToken, user } = useAuthStore.getState();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // For SUPER_ADMIN: Send selected business ID in header
    // This allows the backend to know which business context to use
    const { selectedBusinessId } = useBusinessStore.getState();
    const isSuperAdmin = user?.role === "SUPER_ADMIN";
    
    // Only send x-business-id header when:
    // 1. User is SUPER_ADMIN
    // 2. A specific business is selected (not null, not empty string "")
    if (isSuperAdmin && selectedBusinessId && selectedBusinessId !== "") {
      config.headers["x-business-id"] = selectedBusinessId;
    }

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
    // Extract user-friendly error message from backend response.
    // Axios default is "Request failed with status code XXX" — always prefer
    // the backend message when available.
    if (error.response?.data) {
      const data = error.response.data as any;
      if (data.message) {
        error.message = data.message;
      } else if (data.error) {
        error.message = data.error;
      }
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Trial Free expirado: el backend bloquea la escritura con 402 + code TRIAL_EXPIRED.
    // Avisamos y abrimos el modal de upgrade para que el usuario pueda salir del bloqueo.
    if (error.response?.status === 402) {
      const data = error.response.data as { code?: string; message?: string };
      if (data?.code === "TRIAL_EXPIRED") {
        toast.error(data.message || "Tu período de prueba terminó. Elige un plan para continuar.");
        openUpgradePlanModal();
      }
      return Promise.reject(error);
    }

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
        // Refresh failed — signal AuthProvider to handle navigation
        useAuthStore.getState().clearAuth();
        forceLogout("session_expired");
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

      // Signal AuthProvider to handle navigation (locale-aware, no full reload)
      forceLogout("session_expired");

      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;

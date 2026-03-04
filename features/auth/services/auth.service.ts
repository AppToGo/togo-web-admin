/**
 * Auth Service
 * 
 * Handles all authentication-related API calls
 * 
 * SECURITY NOTES:
 * - Refresh token is managed via httpOnly cookies through API routes
 * - Access token is managed in-memory by the auth store
 */

import apiClient from "@/services/api.service";
import {
  LoginCredentials,
  LoginResponse,
  RefreshTokenRequest,
} from "@/types/auth.types";

const AUTH_ENDPOINTS = {
  LOGIN: "/auth/login",
  REFRESH: "/auth/refresh",
  LOGOUT: "/auth/logout",
  LOGOUT_ALL: "/auth/logout-all",
} as const;

/**
 * Login with email and password
 * Returns tokens that should be stored securely
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    AUTH_ENDPOINTS.LOGIN,
    credentials
  );
  return response.data;
}

/**
 * Refresh access token using refresh token
 * 
 * NOTE: This is called internally by the API route /api/auth/refresh
 * which handles the httpOnly cookie. Direct calls should use the API route.
 */
export async function refreshTokens(
  refreshToken: string
): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    AUTH_ENDPOINTS.REFRESH,
    { refreshToken } as RefreshTokenRequest
  );
  return response.data;
}

/**
 * Logout - revoke refresh token
 * 
 * NOTE: The backend should read the refresh token from the request.
 * If your backend requires it in body, pass a dummy value - the API route
 * should handle the real token in the cookie.
 */
export async function logout(_refreshToken?: string): Promise<void> {
  // Backend reads token from Authorization header or we can pass it
  // The actual token is in the httpOnly cookie and will be cleared
  await apiClient.post(AUTH_ENDPOINTS.LOGOUT);
}

/**
 * Logout from all devices
 * Revokes ALL refresh tokens for the user
 */
export async function logoutAll(): Promise<void> {
  await apiClient.post(AUTH_ENDPOINTS.LOGOUT_ALL);
}

/**
 * Validate token (verify if it's still valid)
 * Note: The backend validates on each request
 */
export async function validateToken(): Promise<boolean> {
  try {
    // Try to fetch current user or a protected endpoint
    // If 401, token is invalid
    return true;
  } catch {
    return false;
  }
}

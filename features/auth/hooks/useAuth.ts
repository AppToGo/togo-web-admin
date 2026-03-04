/**
 * Auth Hooks
 * 
 * React hooks for authentication operations
 * Uses React Query for server state management
 * 
 * SECURITY: These hooks work with the httpOnly cookie architecture
 * - Login: Stores refresh token in httpOnly cookie via API route
 * - Logout: Clears httpOnly cookie via API route
 * - Tokens are never exposed to JavaScript
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { LoginCredentials, RegisterRequest } from "@/types/auth.types";
import { login as loginApi } from "@/features/auth/services/auth.service";

/**
 * Hook for login mutation
 * 
 * Flow:
 * 1. Call backend login API
 * 2. Store refresh token in httpOnly cookie (via /api/auth/set-cookie)
 * 3. Store access token in memory
 * 4. Redirect to dashboard
 */
export function useLogin() {
  const router = useRouter();
  const { setAuthData } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await loginApi(credentials);
      
      // Store refresh token in httpOnly cookie
      await fetch("/api/auth/set-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: response.refresh_token }),
      });
      
      return response;
    },
    onSuccess: (data) => {
      setAuthData(data);
      router.push("/dashboard");
    },
  });
}

/**
 * Hook for logout mutation
 * 
 * Flow:
 * 1. Call backend logout (revokes token)
 * 2. Clear httpOnly cookie (via /api/auth/clear-cookie)
 * 3. Clear in-memory state
 * 4. Redirect to login
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      // Call backend logout - it should read from cookie or we pass dummy
      await fetch("/api/auth/logout-proxy", { method: "POST" });
    },
    onSuccess: async () => {
      // Clear cookie
      await fetch("/api/auth/clear-cookie", { method: "POST" });
      
      // Clear all queries from cache
      queryClient.clear();
      
      // Clear auth state
      clearAuth();
      
      // Redirect to login
      router.push("/login");
    },
    onError: async () => {
      // Even if API fails, clear local state
      await fetch("/api/auth/clear-cookie", { method: "POST" });
      queryClient.clear();
      clearAuth();
      router.push("/login");
    },
  });
}

/**
 * Hook for registration (prepared for future)
 */
export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (_data: RegisterRequest) => {
      // TODO: Implement when backend endpoint is ready
      throw new Error("Registration not implemented yet");
    },
    onSuccess: () => {
      router.push("/login?registered=true");
    },
  });
}

/**
 * Hook for forgot password (prepared for future)
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      // TODO: Implement when backend endpoint is ready
      console.log("Forgot password requested for:", email);
      // Mock success
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { message: "Password reset email sent" };
    },
  });
}

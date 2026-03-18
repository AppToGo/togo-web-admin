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
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { LoginCredentials, RegisterRequest } from "@/types/auth.types";
import { login as loginApi } from "@/features/auth/services/auth.service";
import { extractErrorMessage } from "@/lib/error.utils";

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
      if (process.env.NODE_ENV === "development") {
        console.log("[useLogin] Calling login API...");
      }
      const response = await loginApi(credentials);
      if (process.env.NODE_ENV === "development") {
        console.log("[useLogin] Login successful, got refresh token");
      }
      
      // Store refresh token in httpOnly cookie
      if (process.env.NODE_ENV === "development") {
        console.log("[useLogin] Calling set-cookie API...");
      }
      const setCookieResponse = await fetch("/api/auth/set-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: response.refresh_token }),
        credentials: "include", // CRITICAL: allows cookies to be set
      });
      
      if (process.env.NODE_ENV === "development") {
        console.log("[useLogin] Set-cookie response status:", setCookieResponse.status);
      }
      
      if (!setCookieResponse.ok) {
        const errorData = await setCookieResponse.json();
        console.error("[useLogin] Failed to set cookie:", errorData);
        throw new Error("Failed to set session cookie");
      }
      
      if (process.env.NODE_ENV === "development") {
        console.log("[useLogin] Cookie set successfully");
      }
      return response;
    },
    onSuccess: (data) => {
      if (process.env.NODE_ENV === "development") {
        console.log("[useLogin] Setting auth data and redirecting...");
      }
      setAuthData(data);
      toast.success("¡Bienvenido! Inicio de sesión exitoso");
      router.push("/dashboard");
    },
    onError: (error) => {
      console.error("[useLogin] Login error:", error);
      toast.error(extractErrorMessage(error, "Error al iniciar sesión"));
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
      if (process.env.NODE_ENV === "development") {
        console.log("[useLogout] Calling logout proxy...");
      }
      // Call backend logout - it should read from cookie or we pass dummy
      await fetch("/api/auth/logout-proxy", { 
        method: "POST",
        credentials: "include",
      });
    },
    onSuccess: async () => {
      if (process.env.NODE_ENV === "development") {
        console.log("[useLogout] Clearing cookie...");
      }
      // Clear cookie
      await fetch("/api/auth/clear-cookie", { 
        method: "POST",
        credentials: "include",
      });
      
      if (process.env.NODE_ENV === "development") {
        console.log("[useLogout] Clearing cache and state...");
      }
      // Clear all queries from cache
      queryClient.clear();
      
      // Clear auth state
      clearAuth();
      
      toast.success("Sesión cerrada correctamente");
      
      // Redirect to login
      router.push("/login");
    },
    onError: async (error) => {
      if (process.env.NODE_ENV === "development") {
        console.log("[useLogout] Error, forcing cleanup...");
      }
      toast.error(extractErrorMessage(error, "Error al cerrar sesión"));
      // Even if API fails, clear local state
      await fetch("/api/auth/clear-cookie", { 
        method: "POST",
        credentials: "include",
      });
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
      if (process.env.NODE_ENV === "development") {
        console.log("Forgot password requested for:", email);
      }
      // Mock success
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { message: "Password reset email sent" };
    },
    onSuccess: () => {
      toast.success("Te hemos enviado un correo con las instrucciones");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Error al solicitar recuperación de contraseña"));
    },
  });
}

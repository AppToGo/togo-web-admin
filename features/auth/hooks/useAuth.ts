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
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useRegistrationStore } from "@/features/auth/stores/registration.store";
import {
  LoginCredentials,
  RegisterRequest,
  UpdatePlanRequest,
} from "@/types/auth.types";
import {
  login as loginApi,
  register as registerApi,
  updateRegistrationPlan as updatePlanApi,
} from "@/features/auth/services/auth.service";
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
 * 1. POST /api/auth/logout — atomically revokes token AND clears cookie
 * 2. onSettled: clear in-memory state and navigate to login
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      // Single atomic endpoint: revokes backend token AND clears cookie in one call
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    },
    onSuccess: () => {
      toast.success("Sesión cerrada correctamente");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Error al cerrar sesión"));
    },
    onSettled: () => {
      // Always clean up regardless of success or failure:
      // the /api/auth/logout route guarantees the cookie is cleared
      // via try/finally, so it's safe to clear local state here.
      queryClient.clear();
      clearAuth();
      // router.push() from @/i18n/routing automatically prepends the active locale
      router.push("/login");
    },
  });
}

/**
 * Hook for business registration (Step 1 of wizard)
 *
 * Calls POST /auth/register and advances the wizard to step 2 or 3
 * depending on whether a plan was pre-selected via URL param.
 */
export function useRegister() {
  const { setStep1Complete } = useRegistrationStore();

  return useMutation({
    mutationFn: (data: RegisterRequest) => registerApi(data),
    onSuccess: (data, variables) => {
      setStep1Complete(
        data.businessId,
        data.registrationToken,
        variables.plan ?? null,
        data.registrationStatus
      );
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Error al crear la cuenta";
      if (message.includes("REGISTRATION_NOT_AVAILABLE")) {
        toast.error(
          "No fue posible completar el registro. Verificá los datos e intentá de nuevo."
        );
      } else if (
        message.includes("429") ||
        message.toLowerCase().includes("too many")
      ) {
        toast.error(
          "Demasiados intentos. Esperá un minuto e intentá de nuevo."
        );
      } else {
        toast.error(message);
      }
    },
  });
}

/**
 * Hook for updating plan selection (Step 2 of wizard)
 *
 * Calls PATCH /auth/register/plan and advances the wizard to step 3.
 */
export function useUpdateRegistrationPlan() {
  const { setPlanSelected } = useRegistrationStore();

  return useMutation({
    mutationFn: (data: UpdatePlanRequest) => updatePlanApi(data),
    onSuccess: (_, variables) => {
      setPlanSelected(variables.plan);
      toast.success("Plan seleccionado correctamente");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Error al seleccionar plan";
      if (
        message.toLowerCase().includes("expired") ||
        message.includes("410")
      ) {
        toast.error("Tu sesión de registro expiró. Comenzá de nuevo.");
      } else {
        toast.error(message);
      }
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

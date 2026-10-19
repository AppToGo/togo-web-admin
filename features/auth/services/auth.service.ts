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
  SessionResponse,
  RegisterRequest,
  RegistrationResponse,
  DemoLoginRequest,
  DemoLead,
  DemoLeadDetail,
  DemoLeadFilters,
  DemoLeadNote,
  DemoLeadPipelineEntry,
  UpdateDemoLeadRequest,
} from "@/types/auth.types";

const AUTH_ENDPOINTS = {
  LOGIN: "/auth/login",
  DEMO_LOGIN: "/auth/demo-login",
  REFRESH: "/auth/refresh",
  LOGOUT: "/auth/logout",
  LOGOUT_ALL: "/auth/logout-all",
  SESSION: "/auth/session",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  MY_PERMISSIONS: "/auth/me/permissions",
} as const;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/v1";

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
 * Entrada al modo demo (sin credenciales).
 *
 * Registra al visitante como posible cliente y devuelve los tokens del
 * usuario demo. Usa fetch directo igual que register(): es un endpoint
 * público y el interceptor no debe adjuntar tokens.
 */
export async function demoLogin(
  data: DemoLoginRequest
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}${AUTH_ENDPOINTS.DEMO_LOGIN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message =
      (error as { message?: string | string[] }).message ??
      "No se pudo entrar a la demo";
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return response.json() as Promise<LoginResponse>;
}

/**
 * Posibles clientes de la demo (solo SUPER_ADMIN).
 */
export async function getDemoLeads(
  filters: DemoLeadFilters = {},
): Promise<DemoLead[]> {
  const params = new URLSearchParams();
  if (filters.stage) params.set("stage", filters.stage);
  if (filters.q) params.set("q", filters.q);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.overdueOnly) params.set("overdueOnly", "true");
  if (filters.includeRevoked) params.set("includeRevoked", "true");
  const query = params.toString();
  const response = await apiClient.get<DemoLead[]>(
    query ? `/admin/demo-leads?${query}` : "/admin/demo-leads",
  );
  return response.data;
}

/**
 * Conteo de leads por etapa del pipeline (solo SUPER_ADMIN).
 */
export async function getDemoLeadsPipeline(): Promise<DemoLeadPipelineEntry[]> {
  const response = await apiClient.get<DemoLeadPipelineEntry[]>(
    "/admin/demo-leads/pipeline",
  );
  return response.data;
}

/**
 * Detalle comercial del lead con ficha, resumen, sugerencia,
 * línea de tiempo y notas (solo SUPER_ADMIN).
 */
export async function getDemoLeadDetail(id: string): Promise<DemoLeadDetail> {
  const response = await apiClient.get<DemoLeadDetail>(
    `/admin/demo-leads/${id}`,
  );
  return response.data;
}

/**
 * Actualizar ficha comercial del lead (solo SUPER_ADMIN).
 */
export async function updateDemoLead(
  id: string,
  data: UpdateDemoLeadRequest,
): Promise<DemoLead> {
  const response = await apiClient.patch<DemoLead>(
    `/admin/demo-leads/${id}`,
    data,
  );
  return response.data;
}

/**
 * Agregar nota al lead (solo SUPER_ADMIN).
 */
export async function addDemoLeadNote(
  id: string,
  body: string,
): Promise<DemoLeadNote> {
  const response = await apiClient.post<DemoLeadNote>(
    `/admin/demo-leads/${id}/notes`,
    { body },
  );
  return response.data;
}

/**
 * Eliminar un lead de la demo (solo SUPER_ADMIN).
 */
export async function deleteDemoLead(id: string): Promise<void> {
  await apiClient.delete(`/admin/demo-leads/${id}`);
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

/**
 * Get user session data
 * Fetches complete session context including branches, business info, and preferences
 * Should be called after login and on app initialization
 *
 * @returns SessionResponse with branches, business info, and user preferences
 */
export async function getUserSession(): Promise<SessionResponse> {
  const response = await apiClient.get<SessionResponse>(AUTH_ENDPOINTS.SESSION);
  return response.data;
}

/**
 * Códigos de permiso efectivos del usuario autenticado (Fase C, Etapa 3) —
 * SUPER_ADMIN/OWNER/ADMIN reciben el catálogo completo, OPERATOR sólo lo
 * asignado en su OperatorProfile. Ver `AuthController.getMyPermissions`.
 */
export async function getMyPermissions(): Promise<string[]> {
  const response = await apiClient.get<string[]>(AUTH_ENDPOINTS.MY_PERMISSIONS);
  return response.data;
}

/**
 * Register a new business
 *
 * Uses fetch directly to avoid the Axios interceptor attaching auth tokens
 * to a public endpoint. Returns a registration token for wizard continuation.
 */
export async function register(
  data: RegisterRequest
): Promise<RegistrationResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message =
      (error as { message?: string | string[] }).message ?? "Registration failed";
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return response.json() as Promise<RegistrationResponse>;
}

/**
 * Request password reset email.
 * Always succeeds (backend never reveals if email exists).
 */
export async function forgotPassword(email: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}${AUTH_ENDPOINTS.FORGOT_PASSWORD}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = (error as { message?: string }).message ?? "Error al solicitar recuperación de contraseña";
    throw new Error(message);
  }

  return response.json() as Promise<{ message: string }>;
}

/**
 * Reset password using the token from the email link.
 *
 * @param token - Plain 64-char hex token from URL
 * @param newPassword - New password (min 8 chars)
 */
export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}${AUTH_ENDPOINTS.RESET_PASSWORD}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = (error as { message?: string | string[] }).message ?? "Error al restablecer la contraseña";
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return response.json() as Promise<{ message: string }>;
}

export interface IndustryOption {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

/**
 * Fetch available industries for the registration form.
 * This endpoint is public — no auth token required.
 */
export async function fetchIndustries(): Promise<IndustryOption[]> {
  const response = await fetch(`${API_BASE_URL}/industries`);
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

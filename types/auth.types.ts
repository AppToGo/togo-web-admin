/**
 * Authentication Type Definitions
 * 
 * Types related to authentication and user session
 */

import { UserRole } from "./index";

// Authenticated User (from JWT payload)
export interface AuthenticatedUser {
  userId: string;
  email: string | null;
  name: string;
  role: UserRole;
  businessId: string | null;
  businessName: string | null;
  operatorProfileId: string | null;
  subscriptionPlan?: number;
  /** Fecha límite del trial Free (ISO string). Solo presente si el negocio está en plan Free. */
  trialEndsAt?: string | null;
  /** Plan solicitado (UpgradePlanModal) pendiente de verificación por un SUPER_ADMIN. */
  requestedPlan?: number | null;
  /** Sesión del modo demo. Solo presente si el token es demo. */
  isDemo?: boolean;
  /** Lead capturado en el login demo. Solo presente si isDemo. */
  demoLeadId?: string | null;
  /** Teléfono WhatsApp registrado en el login demo. Solo presente si isDemo. */
  demoPhone?: string | null;
  /** Nombre registrado en el login demo. Solo presente si isDemo. */
  demoName?: string | null;
  /** Código a enviar por WhatsApp para verificar el número. Solo si isDemo. */
  demoVerificationCode?: string | null;
}

// Demo login request (sin credenciales: nombre + WhatsApp del visitante)
export interface DemoLoginRequest {
  name: string;
  phone: string;
}

// Login Request
export interface LoginCredentials {
  email: string;
  password: string;
}

// Login Response from API
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: AuthenticatedUser;
}

// Refresh Token Request
export interface RefreshTokenRequest {
  refreshToken: string;
}

// Auth State
export interface AuthState {
  user: AuthenticatedUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Auth Actions
export interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  setAuthData: (data: LoginResponse) => void;
  clearAuth: () => void;
  setSubscriptionPlan: (plan: number) => void;
  setRequestedPlan: (plan: number) => void;
}

// Registration status
export type RegistrationStatus = 'INCOMPLETE' | 'PENDING_PAYMENT' | 'ACTIVE';

// Registration API response
export interface RegistrationResponse {
  businessId: string;
  registrationToken: string;
  registrationStatus: RegistrationStatus;
}

// Registration request
export interface RegisterRequest {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  businessName: string;
  industryId?: string;
  address?: string;
  city?: string;
}

// Registration wizard state (persisted in sessionStorage for multi-step flow)
export interface RegistrationWizardState {
  currentStep: 1 | 2 | 3;
  businessId: string | null;
  createdAt: number | null; // timestamp for TTL check
}

// Forgot Password (prepared for future implementation)
export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

/**
 * User Branch Information
 * Represents a branch the user has access to
 */
export interface UserBranch {
  id: string;
  name: string;
  isMainBranch: boolean;
  role: string;
}

/**
 * User Preferences
 * Stores user-specific preferences
 */
export interface UserPreferences {
  defaultBranchId: string | null;
}

/**
 * Business Information
 * Basic business details for the session
 */
export interface SessionBusiness {
  id: string;
  name: string;
  plan: string;
  maxBranches: number;
}

/**
 * Session Response
 * Complete session data returned from /auth/session endpoint
 */
export interface DemoContact {
  name: string;
  phone: string;
  /** Código a enviar por WhatsApp a la demo para verificar el número. */
  verificationCode: string | null;
  /** Hasta verificar, el inbox demo está vacío y no se gestionan pedidos. */
  verified: boolean;
}

export interface SessionResponse {
  isDemo: boolean;
  demoContact: DemoContact | null;
  defaultBranchId: string | null;
  branches: UserBranch[];
  business: SessionBusiness;
  userPreferences: UserPreferences;
}

// Posible cliente capturado en el login demo (solo SUPER_ADMIN)
export interface DemoLead {
  id: string;
  businessId: string | null;
  businessName?: string | null;
  name: string;
  phone: string;
  createdAt: string;
  lastDemoAt: string;
  demoCount: number;
}

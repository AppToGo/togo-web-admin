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
  refreshAccessToken: () => Promise<boolean>;
  setAuthData: (data: LoginResponse) => void;
  clearAuth: () => void;
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
export interface SessionResponse {
  defaultBranchId: string | null;
  branches: UserBranch[];
  business: SessionBusiness;
  userPreferences: UserPreferences;
}

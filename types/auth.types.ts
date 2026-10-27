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

// Demo login request (sin credenciales: nombre + WhatsApp del visitante,
// tipo/negocio opcionales y consentimiento de contacto comercial v1)
export interface DemoLoginRequest {
  name: string;
  phone: string;
  businessType?: string;
  businessName?: string;
  consentAccepted: boolean;
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
export type RegistrationStatus = "INCOMPLETE" | "PENDING_PAYMENT" | "ACTIVE";

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
export type DemoLeadStage =
  | "NEW"
  | "ACTIVE_DEMO"
  | "FOLLOW_UP"
  | "CONTACTED"
  | "NEGOTIATION"
  | "CUSTOMER"
  | "LOST";

export type DemoLeadPriority = "HIGH" | "NORMAL" | "LOW";

export interface DemoLead {
  id: string;
  businessId: string | null;
  businessName?: string | null;
  name: string;
  phone: string;
  createdAt: string;
  lastDemoAt: string;
  demoCount: number;
  stage: DemoLeadStage;
  businessType?: string | null;
  establishmentName?: string | null;
  ownerName?: string | null;
  priority: DemoLeadPriority;
  nextAction?: string | null;
  nextActionAt?: string | null;
  revoked: boolean;
  orderCount: number;
  /** DEMO: entró por el login demo. MANUAL: lo creó un super admin. */
  source: DemoLeadSource;
  referredBy?: string | null;
}

export type DemoLeadSource = "DEMO" | "MANUAL" | "SCOUT";

export type WhatsAppDraftTone = "DIRECT" | "CONSULTATIVE" | "FRIENDLY";

export interface GenerateWhatsAppDraftsRequest {
  objective?: string;
  prospectReply?: string;
  tone?: WhatsAppDraftTone;
}

export interface WhatsAppDraftItem {
  id: string;
  label: string;
  message: string;
  rationale: string;
}

export interface WhatsAppDraftsResponse {
  strategyKey: string;
  strategySummary: string;
  recommendedNextStage: DemoLeadStage;
  recommendedNextAction: string;
  recommendedNextActionDays: number;
  drafts: WhatsAppDraftItem[];
}

export interface LogWhatsAppOutreachRequest {
  message: string;
  nextStage?: DemoLeadStage;
  prospectReply?: string;
  nextActionTitle?: string;
  nextActionDueAt?: string;
}

export interface LogWhatsAppOutreachResponse {
  lead: DemoLead;
  previousStage: DemoLeadStage;
  newStage: DemoLeadStage;
}

export type ScoutSearchMode = "PLACES" | "TEXT";

export interface ScoutSearchRequest {
  mode: ScoutSearchMode;
  query?: string;
  rawText?: string;
  defaultBusinessType?: string;
}

export interface ScoutProspectCandidate {
  name: string;
  businessName: string;
  businessType: string;
  phone: string;
  formattedPhone: string;
  address: string | null;
  rating: number | null;
  reviewCount: number | null;
  website: string | null;
  suggestedNote: string;
  alreadyInCrm: boolean;
  existingLeadId: string | null;
  alreadyCustomerBusiness: boolean;
}

export interface ScoutSearchResponse {
  source: "GOOGLE_PLACES" | "AI_TEXT_EXTRACTION";
  candidates: ScoutProspectCandidate[];
}

export interface ScoutImportItem {
  name?: string;
  phone: string;
  businessName: string;
  businessType?: string;
  note?: string;
  priority?: DemoLeadPriority;
}

export interface ScoutImportRequest {
  leads: ScoutImportItem[];
}

export interface ScoutImportResponse {
  createdCount: number;
  skippedDuplicateCount: number;
  createdLeads: DemoLead[];
}

/** Lead creado a mano en el CRM (POST /admin/demo-leads). */
export interface CreateDemoLeadRequest {
  name?: string;
  phone: string;
  businessName?: string;
  businessType?: string;
  referredBy?: string;
  stage?: DemoLeadStage;
  priority?: DemoLeadPriority;
  nextAction?: string;
  nextActionAt?: string;
  note?: string;
  consentGiven?: boolean;
}

export interface DemoLeadPipelineEntry {
  stage: DemoLeadStage;
  count: number;
}

export interface DemoLeadActivityEvent {
  id: string;
  type: string;
  occurredAt: string;
  metadata?: Record<string, unknown> | null;
}

export interface DemoLeadNote {
  id: string;
  body: string;
  authorName: string | null;
  createdAt: string;
}

export interface DemoLeadSuggestion {
  key: string;
  reason: string;
}

export interface DemoLeadDetailLead extends DemoLead {
  estimatedOrders?: number | null;
  planInterest?: string | null;
  mainNeed?: string | null;
  consentAt?: string | null;
  convertedAt?: string | null;
  lostReason?: string | null;
  lostAt?: string | null;
  whatsappDrafts?: WhatsAppDraftsResponse | null;
  whatsappDraftsAt?: string | null;
}

/** Acción de seguimiento de un lead (varias por lead). */
export interface DemoLeadAction {
  id: string;
  title: string;
  dueAt: string | null;
  doneAt: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface DemoLeadDetail {
  lead: DemoLeadDetailLead;
  events: DemoLeadActivityEvent[];
  notes: DemoLeadNote[];
  actions: DemoLeadAction[];
  summary: {
    demoCount: number;
    orderCount: number;
    distinctActionTypes: number;
    hasWhatsApp: boolean;
    repliedInInbox: boolean;
    lastActivityAt: string | null;
  };
  suggestion: DemoLeadSuggestion;
}

export interface DemoLeadFilters {
  stage?: DemoLeadStage;
  q?: string;
  priority?: DemoLeadPriority;
  overdueOnly?: boolean;
  includeRevoked?: boolean;
}

export interface UpdateDemoLeadRequest {
  stage?: DemoLeadStage;
  businessType?: string | null;
  businessName?: string | null;
  estimatedOrders?: number | null;
  planInterest?: string | null;
  mainNeed?: string | null;
  priority?: DemoLeadPriority;
  ownerUserId?: string | null;
  nextAction?: string | null;
  nextActionAt?: string | null;
  lostReason?: string | null;
  revokedAt?: string | null;
}

/**
 * WhatsApp Feature Types
 *
 * Tipos para la integración con WhatsApp Cloud API.
 * Basado en los DTOs del backend.
 */

export type WhatsAppAccountStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "PENDING_SUBSCRIPTION"
  | "TOKEN_INVALID"
  | "PAYMENT_REQUIRED"
  | "DISCONNECTED";
export type RoutingStrategy =
  "DIRECT_TO_BRANCH" | "AUTO_ASSIGN" | "SHARED_INBOX";

export type WhatsAppConnectionType = "CLOUD_API" | "COEXISTENCE";

export interface WhatsAppAccount {
  id: string;
  businessId: string;
  phoneNumber: string;
  metaWabaId: string;
  phoneNumberId: string;
  displayName?: string;
  status: WhatsAppAccountStatus;
  connectionType?: WhatsAppConnectionType;
  contactsSyncStatus?: string;
  historySyncStatus?: string;
  createdAt: string;
  updatedAt: string;
  // NOTE: accessToken is NEVER returned by the backend for security
}

export interface WhatsAppRouting {
  id: string;
  businessId: string;
  whatsappAccountId: string;
  branchId?: string | null;
  strategy: RoutingStrategy;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWhatsAppAccountRequest {
  phoneNumber: string; // E.164
  metaWabaId: string;
  phoneNumberId: string;
  accessToken: string;
  displayName?: string;
}

export interface UpdateWhatsAppAccountRequest {
  displayName?: string;
  status?: WhatsAppAccountStatus;
  accessToken?: string; // Optional — only send if rotating token
}

export interface CreateWhatsAppRoutingRequest {
  whatsappAccountId: string;
  branchId?: string | null;
  strategy: RoutingStrategy;
  isActive?: boolean;
  priority?: number;
}

/**
 * Payload enviado tras completar el flujo de Meta Embedded Signup.
 * El backend intercambia `code` por el access token, registra el número
 * y crea la cuenta + el routing (AUTO_ASSIGN o DIRECT_TO_BRANCH) en un solo paso.
 */
export interface EmbeddedSignupRequest {
  code: string;
  wabaId: string;
  phoneNumberId: string;
  // Best-effort: ver metaUserId en EmbeddedSignupResult (useMetaEmbeddedSignup).
  metaUserId?: string;
  branchId?: string | null;
  displayName?: string;
  /** Coexistencia con la app WhatsApp Business (mismo número en el celular). */
  isCoexistence?: boolean;
}

export interface UpdateWhatsAppRoutingRequest {
  branchId?: string | null;
  strategy?: RoutingStrategy;
  isActive?: boolean;
  priority?: number;
}

/** Mes de consumo de una cuenta. */
export interface WhatsAppUsageMonth {
  yearMonth: string;
  freeMessages: number;
  billableMessages: number;
  percent: number;
  level: "OK" | "WARN" | "EXHAUSTED";
  estimatedCost?: number | null;
  currency?: string | null;
  costAvailable: boolean;
  syncedAt?: string | null;
}

/** Un día del mes en curso (hora de Colombia), conteo en vivo. */
export interface WhatsAppUsageDay {
  date: string;
  free: number;
  billed: number;
}

/** Consumo de una cuenta de WhatsApp del negocio. */
export interface WhatsAppAccountUsage {
  accountId: string;
  phoneNumber: string;
  status: string;
  /**
   * Mes en curso: el mayor entre el conteo en vivo y Analytics de Meta.
   * `syncedAt` = última confirmación con Meta (se concilia cada hora).
   */
  current: WhatsAppUsageMonth;
  /** Día por día del mes en curso hasta hoy. */
  daily: WhatsAppUsageDay[];
  history: WhatsAppUsageMonth[];
}

/** Resultado de conciliar el consumo con Meta a pedido (botón Actualizar). */
export interface WhatsAppUsageSyncResponse {
  accounts: Array<{ accountId: string; ok: boolean; reason: string | null }>;
}

/** Resumen de consumo para el panel del negocio. */
export interface WhatsAppUsageSummary {
  accounts: WhatsAppAccountUsage[];
  botMessagesPerOrder?: number | null;
}

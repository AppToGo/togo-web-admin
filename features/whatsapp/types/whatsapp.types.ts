/**
 * WhatsApp Feature Types
 *
 * Tipos para la integración con WhatsApp Cloud API.
 * Basado en los DTOs del backend.
 */

export type WhatsAppAccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type RoutingStrategy =
  | "DIRECT_TO_BRANCH"
  | "AUTO_ASSIGN"
  | "SHARED_INBOX";

export interface WhatsAppAccount {
  id: string;
  businessId: string;
  phoneNumber: string;
  metaWabaId: string;
  phoneNumberId: string;
  displayName?: string;
  status: WhatsAppAccountStatus;
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

export interface UpdateWhatsAppRoutingRequest {
  branchId?: string | null;
  strategy?: RoutingStrategy;
  isActive?: boolean;
  priority?: number;
}

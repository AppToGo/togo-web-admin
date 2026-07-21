/**
 * WhatsApp Service
 *
 * Servicios para consumir los endpoints de WhatsApp del backend.
 * El businessId se obtiene del JWT del usuario autenticado.
 */

import apiClient from "@/services/api.service";
import type {
  WhatsAppAccount,
  WhatsAppRouting,
  CreateWhatsAppAccountRequest,
  UpdateWhatsAppAccountRequest,
  CreateWhatsAppRoutingRequest,
  UpdateWhatsAppRoutingRequest,
  EmbeddedSignupRequest,
} from "../types";

// ─── WhatsApp Accounts ───────────────────────────────────────────────────────

export async function getWhatsAppAccounts(): Promise<WhatsAppAccount[]> {
  const { data } = await apiClient.get<WhatsAppAccount[]>("/whatsapp-accounts");
  return data;
}

export async function getWhatsAppAccountById(
  id: string
): Promise<WhatsAppAccount> {
  const { data } = await apiClient.get<WhatsAppAccount>(
    `/whatsapp-accounts/${id}`
  );
  return data;
}

export async function createWhatsAppAccount(
  dto: CreateWhatsAppAccountRequest
): Promise<WhatsAppAccount> {
  const { data } = await apiClient.post<WhatsAppAccount>(
    "/whatsapp-accounts",
    dto
  );
  return data;
}

export async function updateWhatsAppAccount(
  id: string,
  dto: UpdateWhatsAppAccountRequest
): Promise<WhatsAppAccount> {
  const { data } = await apiClient.patch<WhatsAppAccount>(
    `/whatsapp-accounts/${id}`,
    dto
  );
  return data;
}

export async function deleteWhatsAppAccount(id: string): Promise<void> {
  await apiClient.delete(`/whatsapp-accounts/${id}`);
}

/**
 * Crea la cuenta (+ routing) a partir de un flujo de Meta Embedded Signup.
 * Disponible para todos los roles (a diferencia de createWhatsAppAccount,
 * que está restringido a SUPER_ADMIN en el backend).
 */
export async function createWhatsAppAccountFromEmbeddedSignup(
  dto: EmbeddedSignupRequest
): Promise<WhatsAppAccount> {
  const { data } = await apiClient.post<WhatsAppAccount>(
    "/whatsapp-accounts/embedded-signup",
    dto
  );
  return data;
}

// ─── WhatsApp Routings ────────────────────────────────────────────────────────

export async function getWhatsAppRoutings(): Promise<WhatsAppRouting[]> {
  const { data } = await apiClient.get<WhatsAppRouting[]>("/whatsapp-routing");
  return data;
}

export async function getWhatsAppRoutingById(
  id: string
): Promise<WhatsAppRouting> {
  const { data } = await apiClient.get<WhatsAppRouting>(
    `/whatsapp-routing/${id}`
  );
  return data;
}

export async function createWhatsAppRouting(
  dto: CreateWhatsAppRoutingRequest
): Promise<WhatsAppRouting> {
  const { data } = await apiClient.post<WhatsAppRouting>(
    "/whatsapp-routing",
    dto
  );
  return data;
}

export async function updateWhatsAppRouting(
  id: string,
  dto: UpdateWhatsAppRoutingRequest
): Promise<WhatsAppRouting> {
  const { data } = await apiClient.patch<WhatsAppRouting>(
    `/whatsapp-routing/${id}`,
    dto
  );
  return data;
}

export async function deleteWhatsAppRouting(id: string): Promise<void> {
  await apiClient.delete(`/whatsapp-routing/${id}`);
}

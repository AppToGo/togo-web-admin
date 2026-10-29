/**
 * Sesiones del modo operador del catálogo web: el mesero abre el catálogo
 * público con una credencial por turno y toma pedidos de mesa a su nombre.
 * POST/GET/DELETE /businesses/:businessId/operator-catalog-sessions
 */

import apiClient from "@/services/api.service";
import type {
  CreatedOperatorCatalogSession,
  CreateOperatorCatalogSessionInput,
  OperatorCatalogSessionAudit,
  OperatorCatalogSessionOptions,
  OperatorCatalogSessionSummary,
} from "../types";

const baseUrl = (businessId: string) =>
  `/businesses/${businessId}/operator-catalog-sessions`;

export async function createOperatorCatalogSession(
  businessId: string,
  data: CreateOperatorCatalogSessionInput
): Promise<CreatedOperatorCatalogSession> {
  const { data: created } = await apiClient.post<CreatedOperatorCatalogSession>(
    baseUrl(businessId),
    data
  );
  return created;
}

/** Operadores elegibles y hora máxima para abrir una sesión en la sede. */
export async function getOperatorCatalogSessionOptions(
  businessId: string,
  branchId: string
): Promise<OperatorCatalogSessionOptions> {
  const { data } = await apiClient.get<OperatorCatalogSessionOptions>(
    `${baseUrl(businessId)}/options`,
    { params: { branchId } }
  );
  return data;
}

export async function getMyOperatorCatalogSessions(
  businessId: string
): Promise<OperatorCatalogSessionSummary[]> {
  const { data } = await apiClient.get<OperatorCatalogSessionSummary[]>(
    `${baseUrl(businessId)}/mine`
  );
  return data;
}

export async function revokeOperatorCatalogSession(
  businessId: string,
  sessionId: string
): Promise<void> {
  await apiClient.delete(`${baseUrl(businessId)}/${sessionId}`);
}

/** Auditoría de habilitaciones (solo el dueño; el servidor lo exige). */
export async function getOperatorCatalogSessionAudit(
  businessId: string
): Promise<OperatorCatalogSessionAudit[]> {
  const { data } = await apiClient.get<OperatorCatalogSessionAudit[]>(
    `${baseUrl(businessId)}/audit`
  );
  return data;
}

/**
 * Conversation Service
 *
 * Servicios para consumir los endpoints de lectura de conversaciones
 * (Fase B, `src/conversation-history` en el backend). El businessId se
 * obtiene del store de autenticación — mismo patrón que
 * `features/customers/services/customer.service.ts`.
 */

import apiClient from "@/services/api.service";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import type {
  ConversationDetail,
  GetConversationsParams,
  PaginatedConversationsResponse,
} from "../types";

function getBusinessId(): string | null {
  const { user } = useAuthStore.getState();
  if (!user?.businessId && user?.role !== "SUPER_ADMIN") {
    throw new Error("Usuario no tiene un negocio asignado");
  }
  return user?.businessId || null;
}

function getBaseUrl(businessId?: string): string {
  const effectiveBusinessId = businessId || getBusinessId();
  if (!effectiveBusinessId) {
    throw new Error("Se requiere un businessId para consultar conversaciones");
  }
  return `/businesses/${effectiveBusinessId}/conversations`;
}

/**
 * Lista paginada de conversaciones. `withoutOrder` y `outcome` son
 * mutuamente excluyentes (400 si se envían juntos — responsabilidad de
 * quien llama, no se valida acá).
 */
export async function getConversations(
  params?: GetConversationsParams & { businessId?: string }
): Promise<PaginatedConversationsResponse> {
  const queryParams: Record<string, string> = {};

  if (params?.page !== undefined) queryParams.page = String(params.page);
  if (params?.limit !== undefined) queryParams.limit = String(params.limit);
  if (params?.dateFrom) queryParams.dateFrom = params.dateFrom;
  if (params?.dateTo) queryParams.dateTo = params.dateTo;
  if (params?.customerId) queryParams.customerId = params.customerId;
  if (params?.outcome?.length) queryParams.outcome = params.outcome.join(",");
  if (params?.withoutOrder !== undefined) {
    queryParams.withoutOrder = String(params.withoutOrder);
  }

  const { data } = await apiClient.get<PaginatedConversationsResponse>(
    getBaseUrl(params?.businessId),
    { params: queryParams }
  );
  return data;
}

export async function getConversationById(
  sessionId: string,
  businessId?: string
): Promise<ConversationDetail> {
  const { data } = await apiClient.get<ConversationDetail>(
    `${getBaseUrl(businessId)}/${sessionId}`
  );
  return data;
}

/**
 * `GET /businesses/:businessId/orders/:id/conversation` — colgado de
 * `OrderController`, no de `/conversations`. 404 si el pedido no tiene
 * `ConversationOrderLink` (el caller lo traduce a "sin conversación").
 */
export async function getConversationByOrderId(
  orderId: string,
  businessId?: string
): Promise<ConversationDetail> {
  const effectiveBusinessId = businessId || getBusinessId();
  if (!effectiveBusinessId) {
    throw new Error("Se requiere un businessId para consultar la conversación");
  }

  const { data } = await apiClient.get<ConversationDetail>(
    `/businesses/${effectiveBusinessId}/orders/${orderId}/conversation`
  );
  return data;
}

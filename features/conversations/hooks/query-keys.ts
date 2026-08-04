import type { GetConversationsParams } from "../types";

/** Mismo patrón jerárquico que CUSTOMERS_KEYS (features/customers/hooks/useCustomers.ts). */
export const CONVERSATIONS_KEYS = {
  all: ["conversations"] as const,
  lists: () => [...CONVERSATIONS_KEYS.all, "list"] as const,
  list: (filters: GetConversationsParams & { businessId?: string }) =>
    [...CONVERSATIONS_KEYS.lists(), JSON.stringify(filters)] as const,
  details: () => [...CONVERSATIONS_KEYS.all, "detail"] as const,
  // businessId como parte de la key (no agregado por separado por cada
  // caller): antes useConversation armaba
  // [...detail(sessionId), effectiveBusinessId] por su cuenta, así que
  // setQueryData(detail(id), ...) no matcheaba nada y el optimistic
  // update/append por WebSocket se perdía en silencio (Fase C, Etapa 3).
  detail: (sessionId: string, businessId?: string) =>
    [...CONVERSATIONS_KEYS.details(), sessionId, businessId] as const,
  byOrder: (orderId: string, businessId?: string) =>
    [...CONVERSATIONS_KEYS.all, "by-order", orderId, businessId] as const,
};

export const STALE_TIME = 30 * 1000;
export const GC_TIME = 5 * 60 * 1000;

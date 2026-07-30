import type { GetConversationsParams } from "../types";

/** Mismo patrón jerárquico que CUSTOMERS_KEYS (features/customers/hooks/useCustomers.ts). */
export const CONVERSATIONS_KEYS = {
  all: ["conversations"] as const,
  lists: () => [...CONVERSATIONS_KEYS.all, "list"] as const,
  list: (filters: GetConversationsParams & { businessId?: string }) =>
    [...CONVERSATIONS_KEYS.lists(), JSON.stringify(filters)] as const,
  details: () => [...CONVERSATIONS_KEYS.all, "detail"] as const,
  detail: (sessionId: string) =>
    [...CONVERSATIONS_KEYS.details(), sessionId] as const,
  byOrder: (orderId: string) =>
    [...CONVERSATIONS_KEYS.all, "by-order", orderId] as const,
};

export const STALE_TIME = 30 * 1000;
export const GC_TIME = 5 * 60 * 1000;

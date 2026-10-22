/**
 * WhatsApp Query Keys
 *
 * Query keys centralizados para mantener consistencia
 * en el cache de TanStack Query para WhatsApp.
 */

export const WHATSAPP_ACCOUNTS_KEYS = {
  all: ["whatsapp-accounts"] as const,
  lists: () => [...WHATSAPP_ACCOUNTS_KEYS.all, "list"] as const,
  detail: (id: string) =>
    [...WHATSAPP_ACCOUNTS_KEYS.all, "detail", id] as const,
  // Fuera de lists(): las mutaciones de cuentas invalidan lists() y no deben
  // volver a pedir el consumo a Meta. Por negocio: un SUPER_ADMIN que cambia
  // de negocio no ve el consumo cacheado del anterior.
  usage: (businessId: string | null) =>
    [...WHATSAPP_ACCOUNTS_KEYS.all, "usage", businessId] as const,
};

export const WHATSAPP_ROUTING_KEYS = {
  all: ["whatsapp-routing"] as const,
  lists: () => [...WHATSAPP_ROUTING_KEYS.all, "list"] as const,
  detail: (id: string) =>
    [...WHATSAPP_ROUTING_KEYS.all, "detail", id] as const,
};

export const STALE_TIME = 30 * 1000; // 30 seconds
export const GC_TIME = 5 * 60 * 1000; // 5 minutes

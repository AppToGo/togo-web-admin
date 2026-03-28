/**
 * Branch Query Keys
 *
 * Query keys centralizados para mantener consistencia
 * en el cache de TanStack Query para sucursales.
 */

export const BRANCHES_KEYS = {
  all: ["branches"] as const,
  lists: () => [...BRANCHES_KEYS.all, "list"] as const,
  byBusiness: (businessId: string) => [...BRANCHES_KEYS.all, "business", businessId] as const,
  detail: (id: string) => [...BRANCHES_KEYS.all, "detail", id] as const,
  canCreate: () => [...BRANCHES_KEYS.all, "can-create"] as const,
};

// Stale times configurables
export const STALE_TIME = 30 * 1000; // 30 seconds
export const GC_TIME = 5 * 60 * 1000; // 5 minutes

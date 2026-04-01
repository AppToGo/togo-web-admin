/**
 * Operator Profiles Query Keys
 *
 * Query keys centralizados para mantener consistencia
 * en el cache de TanStack Query para perfiles de operadores.
 */

export const OPERATOR_PROFILES_KEYS = {
  all: ["operator-profiles"] as const,
  lists: () => [...OPERATOR_PROFILES_KEYS.all, "list"] as const,
  detail: (id: string) => [...OPERATOR_PROFILES_KEYS.all, "detail", id] as const,
  catalog: () => [...OPERATOR_PROFILES_KEYS.all, "catalog"] as const,
};

// Stale times configurables
export const STALE_TIME = 30 * 1000; // 30 seconds
export const GC_TIME = 5 * 60 * 1000; // 5 minutes

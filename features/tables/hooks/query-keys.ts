/**
 * Table Query Keys
 *
 * Query keys centralizados para el cache de TanStack Query de mesas.
 */

export const TABLES_KEYS = {
  all: ["tables"] as const,
  byBranch: (businessId: string, branchId: string) =>
    [...TABLES_KEYS.all, "branch", businessId, branchId] as const,
};

export const STALE_TIME = 30 * 1000; // 30 seconds
export const GC_TIME = 5 * 60 * 1000; // 5 minutes

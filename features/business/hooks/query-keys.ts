/**
 * Business Query Keys
 * Centralized query keys for TanStack Query
 */

export const BUSINESS_KEYS = {
  all: ["business"] as const,
  lists: () => [...BUSINESS_KEYS.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...BUSINESS_KEYS.lists(), filters] as const,
  details: () => [...BUSINESS_KEYS.all, "detail"] as const,
  detail: (id: string) => [...BUSINESS_KEYS.details(), id] as const,
  current: () => [...BUSINESS_KEYS.all, "current"] as const,
  slugCheck: (slug: string) =>
    [...BUSINESS_KEYS.all, "slug-check", slug] as const,
};

/**
 * Query Keys for Business Management
 * Centralized query keys for TanStack Query
 */

export const ADMIN_BUSINESS_KEYS = {
  all: ["admin-businesses"] as const,
  businesses: () => [...ADMIN_BUSINESS_KEYS.all, "list"] as const,
  business: (id: string) => [...ADMIN_BUSINESS_KEYS.all, "detail", id] as const,
  alerts: () => [...ADMIN_BUSINESS_KEYS.all, "alerts"] as const,
  filters: (filters: object) =>
    [...ADMIN_BUSINESS_KEYS.businesses(), { filters }] as const,
} as const;

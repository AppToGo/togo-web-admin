/**
 * Branch Inventory Query Keys
 * 
 * Centralized query keys for TanStack Query cache management.
 * Follows the pattern established in other features.
 */

export const BRANCH_INVENTORY_KEYS = {
  all: ["branch-inventory"] as const,
  lists: () => [...BRANCH_INVENTORY_KEYS.all, "list"] as const,
  byBranch: (businessId: string, branchId: string) =>
    [...BRANCH_INVENTORY_KEYS.all, "branch", businessId, branchId] as const,
  detail: (businessId: string, branchId: string, productId: string) =>
    [...BRANCH_INVENTORY_KEYS.all, "detail", businessId, branchId, productId] as const,
} as const;

// Stale times configurable
export const STALE_TIME = 30 * 1000; // 30 seconds
export const GC_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Order Status Constants
 *
 * Defines LIVE vs ARCHIVE status categories for optimized data loading.
 * - LIVE: Orders that are actively being processed (loaded all at once)
 * - ARCHIVE: Completed orders (loaded with infinite scroll pagination)
 */

import type { OrderStatus } from "../types";

/**
 * Live order statuses - orders that are actively being processed
 * These are loaded all at once since they're limited in number
 */
export const LIVE_STATUSES: OrderStatus[] = [
  "DRAFT",
  "CONFIRMED",
  "PAYMENT_PENDING",
  "PAID",
  "IN_PROGRESS",
  "READY",
  "CANCELLED",
  "ABANDONED",
];

/**
 * Archive status - completed orders
 * These use infinite scroll pagination due to potentially large volume
 */
export const ARCHIVE_STATUS: OrderStatus = "COMPLETED";

/**
 * All order statuses (for reference)
 */
export const ALL_STATUSES: OrderStatus[] = [
  ...LIVE_STATUSES,
  ARCHIVE_STATUS,
];

/**
 * Check if a status is a live (active) status
 */
export function isLiveStatus(status: OrderStatus): boolean {
  return LIVE_STATUSES.includes(status);
}

/**
 * Check if a status is the archive (completed) status
 */
export function isArchiveStatus(status: OrderStatus): boolean {
  return status === ARCHIVE_STATUS;
}

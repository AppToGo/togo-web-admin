/**
 * Order Lateness Utils
 *
 * Single source of truth for "how long has this order been waiting" and the
 * thresholds that turn it amber/red. Used by the card timer, the "By status"
 * tabs and the live stats ticker so the three always agree.
 */

import type { Order } from "../types";

const MS_PER_MINUTE = 60_000;

/** Minutes after which an active order is highlighted as a warning (amber). */
export const LATE_WARNING_MINUTES = 10;
/** Minutes after which an active order is highlighted as critical (red). */
export const LATE_CRITICAL_MINUTES = 20;

export type LatenessLevel = "ok" | "warning" | "critical";

/** Whole minutes elapsed since the order was created. */
export function getElapsedMinutes(createdAt: Date | string, now: number = Date.now()): number {
  return Math.floor((now - new Date(createdAt).getTime()) / MS_PER_MINUTE);
}

/** Elapsed minutes of the oldest order in the list, or null for an empty list. */
export function getOldestElapsedMinutes(
  orders: Pick<Order, "createdAt">[],
  now: number = Date.now()
): number | null {
  if (orders.length === 0) return null;
  return Math.max(...orders.map((order) => getElapsedMinutes(order.createdAt, now)));
}

export function getLatenessLevel(minutes: number): LatenessLevel {
  if (minutes >= LATE_CRITICAL_MINUTES) return "critical";
  if (minutes >= LATE_WARNING_MINUTES) return "warning";
  return "ok";
}

import type { CustomerMetrics } from "../types";

const DAY_MS = 86_400_000;

/** Días promedio entre pedidos; null con menos de dos pedidos. */
export function daysBetweenOrders(metrics: CustomerMetrics): number | null {
  if (metrics.totalOrders < 2 || !metrics.firstOrderDate || !metrics.lastOrderDate) {
    return null;
  }
  const span =
    new Date(metrics.lastOrderDate).getTime() -
    new Date(metrics.firstOrderDate).getTime();
  return Math.max(1, Math.round(span / DAY_MS / (metrics.totalOrders - 1)));
}

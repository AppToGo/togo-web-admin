/**
 * Billing Status Constants
 *
 * Config propia de colores/labels para el estado de pago de la
 * suscripción — deliberadamente NO importa `PAYMENT_STATUS_CONFIG` de
 * `features/admin/business-management/`: esa feature es de alcance
 * SUPER_ADMIN, y el precedente en el repo va en la otra dirección (admin ya
 * importa `UNLIMITED_PLAN_LIMIT` desde esta feature, nunca al revés).
 * Duplicar 4 entradas de color es más barato que acoplar bounded contexts.
 */

import type { BusinessPaymentStatus } from "../types/billing.types";

export const PAYMENT_STATUS_COLORS: Record<BusinessPaymentStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  PAID: "bg-emerald-100 text-emerald-700 border-emerald-200",
  OVERDUE: "bg-red-100 text-red-700 border-red-200",
  GRACE_PERIOD: "bg-amber-100 text-amber-700 border-amber-200",
};

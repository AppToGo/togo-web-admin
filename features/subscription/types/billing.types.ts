/**
 * Billing Types
 *
 * Reflejan a mano los DTOs de `src/billing/dto/*` del backend — no hay
 * codegen de tipos en este repo, se escriben por feature (mismo criterio
 * que `features/customers/types`).
 */

export type BusinessPaymentStatus = "PENDING" | "PAID" | "OVERDUE" | "GRACE_PERIOD";

/** Los 4 valores reales del enum Prisma `NotificationType` — NO los 4 que
 * ofrece `SendNotificationModal` (admin), que no coinciden con el enum y
 * hoy devuelven 400 en el backend salvo `PAYMENT_REMINDER`. */
export type PaymentNotificationType = "REMINDER" | "OVERDUE" | "WARNING" | "PAYMENT_REMINDER";

export type SubscriptionBlockReason = "TRIAL_EXPIRED" | "PAYMENT_OVERDUE";

export interface SubscriptionStatus {
  plan: number;
  planName: string;
  priceMonthly: number;
  currency: string;
  maxBranches: number;
  maxUsers: number;
  /** Lo que mantienen los crons diarios — puede ir hasta un ciclo detrás de `isBlocked`. */
  paymentStatus: BusinessPaymentStatus;
  /** Evaluado en vivo en el backend (misma fuente de verdad que el guard de acceso). */
  isBlocked: boolean;
  blockReason: SubscriptionBlockReason | null;
  lastPaymentAt: string | null;
  nextPaymentDue: string | null;
  /** Negativo si ya venció. null si no aplica (ej: trial Free, que vence por trialEndsAt). */
  daysUntilDue: number | null;
  gracePeriodDays: number;
  isInGracePeriod: boolean;
  /** Fin del trial Free. null en planes pagos. */
  trialEndsAt: string | null;
  requestedPlan: number | null;
  requestedPlanName: string | null;
  requestedPlanAt: string | null;
  requestGraceEndsAt: string | null;
  totalPaid: string;
  /** false = el negocio nunca tuvo fila de BusinessSubscription (estado sintético). */
  hasSubscriptionRecord: boolean;
}

export interface OwnerPaymentRecord {
  id: string;
  amount: string;
  method: string;
  reference: string | null;
  paidAt: string;
}

export interface OwnerPaymentNotification {
  id: string;
  type: PaymentNotificationType;
  sentAt: string;
  message: string;
  channel: string;
}

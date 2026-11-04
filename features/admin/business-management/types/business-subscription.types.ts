/**
 * Business Subscription Types
 * Types for Super Admin business subscription management
 */

import type { Business } from "@/features/business/types/business.types";

export interface BusinessSubscription {
  id: string;
  businessId: string;
  plan: number;
  paymentStatus: 'PENDING' | 'PAID' | 'OVERDUE' | 'GRACE_PERIOD';
  lastPaymentAt: string | null;
  nextPaymentDue: string | null;
  maxBranchesOverride: number | null;
  /** Límite personalizado de usuarios activos. null = límite del plan. */
  maxUsersOverride: number | null;
  /** Cupo mensual personalizado de análisis de comprobantes. null = límite del plan. */
  proofQuotaOverride: number | null;
  /** Precio mensual por usuario por encima del límite del plan. null = sin cobro. */
  extraUserPriceMonthly: number | null;
  /** Precio mensual por sede por encima del límite del plan. null = sin cobro. */
  extraBranchPriceMonthly: number | null;
  gracePeriodDays: number;
  /** Plan solicitado por el negocio (UpgradePlanModal), pendiente de verificación. null = sin solicitud. */
  requestedPlan: number | null;
  /** Cuándo se hizo la solicitud de cambio de plan. */
  requestedPlanAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  businessId: string;
  amount: number;
  method: string;
  reference: string | null;
  notes: string | null;
  paidAt: string;
  /** null cuando el pago lo concilió automáticamente el webhook de Wompi (sin SUPER_ADMIN detrás). */
  createdByUserId: string | null;
  createdAt: string;
  /** ID de la transacción de Wompi, si el pago se hizo por esa vía. */
  wompiTransactionId?: string | null;
}

export interface BusinessWithSubscription extends Business {
  subscription: BusinessSubscription | null;
  branchesCount: number;
  /** Usuarios activos, sin contar el usuario demo de ToGo. */
  userCount: number;
  /** Límite efectivo de usuarios (personalizado o del plan). */
  maxUsers: number;
  orderCount: number;
  totalPaid: string;
  daysUntilDue: number | null;
  isInGracePeriod?: boolean;
}

export interface BusinessFilters {
  plan?: number;
  paymentStatuses?: string[];
  search?: string;
  statusFilter?: 'all' | 'active' | 'inactive';
  page?: number;
  limit?: number;
}

export interface PaginatedBusinesses {
  data: BusinessWithSubscription[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UpdateBranchesLimitDto {
  maxBranchesOverride: number | null;
  /** Precio mensual por sede adicional. Obligatorio si el límite supera el del plan. */
  extraUnitPrice?: number | null;
}

export interface UpdateUsersLimitDto {
  maxUsersOverride: number | null;
  /** Precio mensual por usuario adicional. Obligatorio si el límite supera el del plan. */
  extraUnitPrice?: number | null;
}

/** Usuarios o sedes por encima del límite del plan (montos en pesos). */
export interface ExtraLine {
  count: number;
  unitPrice: number;
  amount: number;
}

/** Lo que se cobra cada mes: plan más usuarios y sedes adicionales. */
export interface MonthlyBreakdown {
  plan: number;
  planName: string;
  planAmount: number;
  users: ExtraLine;
  branches: ExtraLine;
  total: number;
}

export type AddonType = "USERS" | "BRANCHES";

/**
 * - CHARGED: se cobra hoy el prorrateo; el límite se activa al aprobarse.
 * - APPLIED_NEXT_CYCLE: se aplica ya y se cobra desde el próximo pago.
 * - APPLIED: se aplica ya, sin subir la mensualidad.
 */
export type AddonMode = "CHARGED" | "APPLIED_NEXT_CYCLE" | "APPLIED";

export interface AddonQuoteParams {
  type: AddonType;
  limit: number | null;
  unitPrice: number | null;
}

export interface AddonQuote {
  mode: AddonMode;
  amountInCents: number;
  currency: string;
  proratedDays: number | null;
  current: MonthlyBreakdown;
  next: MonthlyBreakdown;
  card: { brand: string | null; lastFour: string | null } | null;
}

export interface UpdateLimitResponse extends BusinessWithSubscription {
  charge: { mode: AddonMode; amountInCents: number; reference: string | null };
}

export interface UpdateProofQuotaDto {
  proofQuotaOverride: number | null;
}

export interface RecordPaymentDto {
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
  paidAt?: string;
  /**
   * Plan a activar junto con este pago. Si se omite y el negocio tiene una
   * solicitud pendiente (subscription.requestedPlan), el backend activa esa.
   */
  activatePlan?: number;
  /**
   * Marca explícita de "no activar ningún plan con este pago" — necesaria
   * porque `activatePlan` ausente es indistinguible de "no especificado"
   * (que el backend interpreta como "activar la solicitud pendiente, si hay").
   * Tiene prioridad sobre activatePlan y sobre cualquier solicitud pendiente.
   */
  skipPlanActivation?: boolean;
}

/** Valores reales del enum `NotificationType` de la API. */
export type NotificationTypeValue = 'PAYMENT_REMINDER' | 'REMINDER' | 'OVERDUE' | 'WARNING';

export interface SendNotificationDto {
  type: NotificationTypeValue;
  subject: string;
  message: string;
  /** El aviso se envía por correo al dueño; sin correo solo queda en su panel. */
  sendEmail?: boolean;
}

/**
 * Alerta de pago del super admin (`PaymentAlertDto` en api-togo,
 * docs/cobro-suscripciones.md §7), en orden de urgencia.
 */
export type PaymentAlertKind =
  | 'SUSPENDED'
  | 'PAYMENT_PENDING'
  | 'TRIAL_EXPIRED'
  | 'DUE_SOON'
  | 'TRIAL_ENDING'
  | 'CANCEL_SCHEDULED'
  | 'PLAN_REQUEST'
  | 'CANCELLED';

export interface PaymentAlert {
  businessId: string;
  businessName: string;
  businessPhone: string;
  kind: PaymentAlertKind;
  paymentStatus: 'PENDING' | 'PAID' | 'OVERDUE' | 'GRACE_PERIOD';
  nextPaymentDue: string | null;
  daysUntilDue: number;
  /** Solo PAYMENT_PENDING. */
  daysUntilSuspension: number | null;
  trialEndsAt: string | null;
  hasCard: boolean;
  lastDeclineReason: string | null;
  plan: number;
  requestedPlan: number | null;
}

/** Un cobro que ToGo inició en Wompi (historial por negocio). */
export interface ChargeAttempt {
  id: string;
  kind: 'RENEWAL' | 'CHECKOUT' | 'UPGRADE';
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED';
  cycleDueDate: string | null;
  attemptNumber: number;
  plan: number;
  planName: string;
  amountInCents: number;
  currency: string;
  reference: string;
  wompiTransactionId: string | null;
  statusMessage: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

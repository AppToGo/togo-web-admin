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
  createdByUserId: string;
  createdAt: string;
}

export interface BusinessWithSubscription extends Business {
  subscription: BusinessSubscription | null;
  branchesCount: number;
  userCount: number;
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

export interface SendNotificationDto {
  type: 'PAYMENT_REMINDER' | 'OVERDUE_WARNING' | 'GRACE_PERIOD_NOTICE' | 'CUSTOM';
  subject: string;
  message: string;
  sendEmail?: boolean;
  sendInApp?: boolean;
}

export interface PaymentAlert {
  businessId: string;
  businessName: string;
  daysUntilDue: number;
  severity: 'SAFE' | 'WARNING' | 'URGENT' | 'CRITICAL' | 'OVERDUE';
}

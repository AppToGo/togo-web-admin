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
  daysUntilDue: number | null;
}

export interface BusinessFilters {
  plan?: number;
  paymentStatus?: string;
  search?: string;
  isActive?: boolean;
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

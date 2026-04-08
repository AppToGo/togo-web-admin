/**
 * Admin Business Service
 * API service for Super Admin business management
 *
 * Backend endpoints:
 * - GET /admin/businesses
 * - GET /admin/businesses/payment-alerts
 * - PATCH /admin/businesses/:id/branches-limit
 * - POST /admin/businesses/:id/payments
 * - POST /admin/businesses/:id/notifications
 * - PATCH /admin/businesses/:id/status
 */

import apiClient from "@/services/api.service";
import type {
  BusinessWithSubscription,
  BusinessFilters,
  PaginatedBusinesses,
  UpdateBranchesLimitDto,
  RecordPaymentDto,
  SendNotificationDto,
  PaymentRecord,
} from "../types/business-subscription.types";

// ============================================================================
// BUSINESSES API
// ============================================================================

/**
 * Get all businesses with filters and pagination
 * GET /admin/businesses
 */
export async function getBusinesses(
  filters?: BusinessFilters
): Promise<PaginatedBusinesses> {
  const params = new URLSearchParams();
  if (filters?.plan !== undefined) params.append("plan", String(filters.plan));
  if (filters?.paymentStatuses?.length) {
    filters.paymentStatuses.forEach(s => params.append("paymentStatuses", s));
  }
  if (filters?.search) params.append("search", filters.search);
  if (filters?.statusFilter && filters.statusFilter !== "all") {
    params.append("statusFilter", filters.statusFilter);
  }
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.limit) params.append("limit", String(filters.limit));

  const response = await apiClient.get<PaginatedBusinesses>(
    `/admin/businesses?${params}`
  );
  return response.data;
}

/**
 * Get payment alerts (businesses with pending/overdue payments)
 * GET /admin/businesses/payment-alerts
 */
export async function getPaymentAlerts(): Promise<BusinessWithSubscription[]> {
  const response = await apiClient.get<BusinessWithSubscription[]>("/admin/businesses/payment-alerts");
  return response.data;
}

/**
 * Update branches limit for a business
 * PATCH /admin/businesses/:id/branches-limit
 */
export async function updateBranchesLimit(
  businessId: string,
  data: UpdateBranchesLimitDto
): Promise<BusinessWithSubscription> {
  const response = await apiClient.patch<BusinessWithSubscription>(
    `/admin/businesses/${businessId}/branches-limit`,
    data
  );
  return response.data;
}

/**
 * Record a payment for a business
 * POST /admin/businesses/:id/payments
 */
export async function recordPayment(
  businessId: string,
  data: RecordPaymentDto
): Promise<PaymentRecord> {
  const response = await apiClient.post<PaymentRecord>(
    `/admin/businesses/${businessId}/payments`,
    data
  );
  return response.data;
}

/**
 * Send notification to business
 * POST /admin/businesses/:id/notifications
 */
export async function sendNotification(
  businessId: string,
  data: SendNotificationDto
): Promise<{ success: boolean; sentAt: string }> {
  const response = await apiClient.post<{ success: boolean; sentAt: string }>(
    `/admin/businesses/${businessId}/notifications`,
    data
  );
  return response.data;
}

/**
 * Toggle business active status
 * PATCH /admin/businesses/:id/status
 */
export async function toggleBusinessStatus(
  businessId: string,
  isActive: boolean
): Promise<BusinessWithSubscription> {
  const response = await apiClient.patch<BusinessWithSubscription>(
    `/admin/businesses/${businessId}/status`,
    { isActive }
  );
  return response.data;
}

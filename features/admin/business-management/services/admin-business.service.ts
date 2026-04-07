/**
 * Admin Business Service
 * API service for Super Admin business management
 * 
 * Backend endpoints:
 * - GET /admin/businesses
 * - GET /admin/businesses/alerts
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
// CONFIGURATION
// ============================================================================

// Toggle between mock and real API
const USE_MOCK = false;

// ============================================================================
// MOCK DATA (for development)
// ============================================================================

const mockBusinesses: BusinessWithSubscription[] = [
  {
    id: "bus1",
    name: "Farmacia San Pablo",
    slug: "farmacia-san-pablo",
    isActive: true,
    industryId: "ind3",
    industry: { id: "ind3", name: "Farmacia" },
    catalogVisibility: "PUBLIC",
    catalogMode: "MARKETPLACE",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-03-10T14:30:00Z",
    subscriptionPlan: 3,
    subscription: {
      id: "sub1",
      businessId: "bus1",
      plan: 3,
      paymentStatus: "PAID",
      lastPaymentAt: "2024-03-01T10:00:00Z",
      nextPaymentDue: "2024-04-01T10:00:00Z",
      maxBranchesOverride: null,
      gracePeriodDays: 7,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-03-01T10:00:00Z",
    },
    branchesCount: 5,
    daysUntilDue: 15,
  },
  {
    id: "bus2",
    name: "OXXO Centro",
    slug: "oxxo-centro",
    isActive: true,
    industryId: "ind2",
    industry: { id: "ind2", name: "Alimentos" },
    catalogVisibility: "PUBLIC",
    catalogMode: "MARKETPLACE",
    createdAt: "2024-01-20T10:00:00Z",
    updatedAt: "2024-03-12T14:30:00Z",
    subscriptionPlan: 4,
    subscription: {
      id: "sub2",
      businessId: "bus2",
      plan: 4,
      paymentStatus: "PENDING",
      lastPaymentAt: "2024-02-01T10:00:00Z",
      nextPaymentDue: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      maxBranchesOverride: 150,
      gracePeriodDays: 7,
      createdAt: "2024-01-20T10:00:00Z",
      updatedAt: "2024-02-01T10:00:00Z",
    },
    branchesCount: 120,
    daysUntilDue: 2,
  },
  {
    id: "bus3",
    name: "Tienda La Esquina",
    slug: "tienda-la-esquina",
    isActive: true,
    industryId: "ind2",
    industry: { id: "ind2", name: "Alimentos" },
    catalogVisibility: "PRIVATE",
    catalogMode: "MENU",
    createdAt: "2024-02-01T10:00:00Z",
    updatedAt: "2024-03-15T14:30:00Z",
    subscriptionPlan: 2,
    subscription: {
      id: "sub3",
      businessId: "bus3",
      plan: 2,
      paymentStatus: "OVERDUE",
      lastPaymentAt: "2024-01-15T10:00:00Z",
      nextPaymentDue: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      maxBranchesOverride: null,
      gracePeriodDays: 7,
      createdAt: "2024-02-01T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
    },
    branchesCount: 2,
    daysUntilDue: -5,
  },
  {
    id: "bus4",
    name: "Café Aroma",
    slug: "cafe-aroma",
    isActive: false,
    industryId: "ind1",
    industry: { id: "ind1", name: "Bebidas" },
    catalogVisibility: "PUBLIC",
    catalogMode: "HYBRID",
    createdAt: "2024-02-10T10:00:00Z",
    updatedAt: "2024-03-18T14:30:00Z",
    subscriptionPlan: 1,
    subscription: {
      id: "sub4",
      businessId: "bus4",
      plan: 1,
      paymentStatus: "GRACE_PERIOD",
      lastPaymentAt: null,
      nextPaymentDue: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      maxBranchesOverride: null,
      gracePeriodDays: 7,
      createdAt: "2024-02-10T10:00:00Z",
      updatedAt: "2024-02-10T10:00:00Z",
    },
    branchesCount: 1,
    daysUntilDue: 1,
  },
  {
    id: "bus5",
    name: "Supermercado Express",
    slug: "supermercado-express",
    isActive: true,
    industryId: "ind2",
    industry: { id: "ind2", name: "Alimentos" },
    catalogVisibility: "PUBLIC",
    catalogMode: "MARKETPLACE",
    createdAt: "2024-02-15T10:00:00Z",
    updatedAt: "2024-03-20T14:30:00Z",
    subscriptionPlan: 3,
    subscription: {
      id: "sub5",
      businessId: "bus5",
      plan: 3,
      paymentStatus: "PENDING",
      lastPaymentAt: "2024-03-01T10:00:00Z",
      nextPaymentDue: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      maxBranchesOverride: 12,
      gracePeriodDays: 7,
      createdAt: "2024-02-15T10:00:00Z",
      updatedAt: "2024-03-01T10:00:00Z",
    },
    branchesCount: 8,
    daysUntilDue: 5,
  },
];

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
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    let filtered = [...mockBusinesses];

    // Apply filters
    if (filters?.plan !== undefined) {
      filtered = filtered.filter((b) => b.subscription?.plan === filters.plan);
    }
    if (filters?.paymentStatus) {
      filtered = filtered.filter((b) => b.subscription?.paymentStatus === filters.paymentStatus);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(search) ||
          b.slug.toLowerCase().includes(search)
      );
    }
    if (filters?.isActive !== undefined) {
      filtered = filtered.filter((b) => b.isActive === filters.isActive);
    }

    // Pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedData = filtered.slice(start, end);

    return {
      data: paginatedData,
      meta: {
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit),
      },
    };
  }

  const params = new URLSearchParams();
  if (filters?.plan !== undefined) params.append("plan", String(filters.plan));
  if (filters?.paymentStatus) params.append("paymentStatus", filters.paymentStatus);
  if (filters?.search) params.append("search", filters.search);
  if (filters?.isActive !== undefined) params.append("isActive", String(filters.isActive));
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.limit) params.append("limit", String(filters.limit));

  const response = await apiClient.get<PaginatedBusinesses>(
    `/admin/businesses?${params}`
  );
  return response.data;
}

/**
 * Get payment alerts (businesses with pending/overdue payments)
 * GET /admin/businesses/alerts
 */
export async function getPaymentAlerts(): Promise<BusinessWithSubscription[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    // Return businesses with daysUntilDue <= 7 or OVERDUE status
    return mockBusinesses.filter(
      (b) =>
        b.subscription?.paymentStatus === "OVERDUE" ||
        b.subscription?.paymentStatus === "GRACE_PERIOD" ||
        (b.daysUntilDue !== null && b.daysUntilDue <= 7)
    );
  }

  const response = await apiClient.get<BusinessWithSubscription[]>("/admin/businesses/alerts");
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
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const index = mockBusinesses.findIndex((b) => b.id === businessId);
    if (index === -1) throw new Error("Negocio no encontrado");
    
    if (mockBusinesses[index].subscription) {
      mockBusinesses[index].subscription!.maxBranchesOverride = data.maxBranchesOverride;
      mockBusinesses[index].subscription!.updatedAt = new Date().toISOString();
    }
    return mockBusinesses[index];
  }

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
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const business = mockBusinesses.find((b) => b.id === businessId);
    if (!business) throw new Error("Negocio no encontrado");

    const payment: PaymentRecord = {
      id: `pay${Date.now()}`,
      businessId,
      amount: data.amount,
      method: data.method,
      reference: data.reference || null,
      notes: data.notes || null,
      paidAt: data.paidAt || new Date().toISOString(),
      createdByUserId: "current-user",
      createdAt: new Date().toISOString(),
    };

    // Update business subscription
    if (business.subscription) {
      business.subscription.lastPaymentAt = payment.paidAt;
      business.subscription.paymentStatus = "PAID";
      // Set next payment due to 30 days from now
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + 30);
      business.subscription.nextPaymentDue = nextDue.toISOString();
      business.daysUntilDue = 30;
    }

    return payment;
  }

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
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    
    const business = mockBusinesses.find((b) => b.id === businessId);
    if (!business) throw new Error("Negocio no encontrado");

    return {
      success: true,
      sentAt: new Date().toISOString(),
    };
  }

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
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    const index = mockBusinesses.findIndex((b) => b.id === businessId);
    if (index === -1) throw new Error("Negocio no encontrado");
    
    mockBusinesses[index].isActive = isActive;
    mockBusinesses[index].updatedAt = new Date().toISOString();
    
    return mockBusinesses[index];
  }

  const response = await apiClient.patch<BusinessWithSubscription>(
    `/admin/businesses/${businessId}/status`,
    { isActive }
  );
  return response.data;
}

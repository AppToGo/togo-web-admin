/**
 * Order Cache Types
 *
 * Type definitions for React Query cache keys and infinite scroll responses.
 */

import type { Order, OrderStatus } from "./order.types";

/**
 * React Query cache keys for orders feature
 * Structured for optimal cache invalidation and grouping
 */
export const ORDERS_KEYS = {
  all: ["orders"] as const,
  // Legacy keys for backward compatibility
  lists: () => [...ORDERS_KEYS.all, "list"] as const,
  list: (filters: object) =>
    [...ORDERS_KEYS.lists(), JSON.stringify(filters)] as const,
  details: () => [...ORDERS_KEYS.all, "detail"] as const,
  detail: (id: string) => [...ORDERS_KEYS.details(), id] as const,
  history: (id: string) => [...ORDERS_KEYS.detail(id), "history"] as const,
  // New Live vs Archive keys
  live: (businessId: string | undefined, filters: object) =>
    [...ORDERS_KEYS.all, businessId, "live", filters] as const,
  completed: (businessId: string | undefined, filters: object) =>
    [...ORDERS_KEYS.all, businessId, "completed", filters] as const,
};

/**
 * Filters for live orders query
 */
export interface LiveOrdersFilters {
  businessId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  branchIds?: string[];
}

/**
 * Filters for completed orders query (infinite scroll)
 */
export interface CompletedOrdersFilters {
  businessId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  branchIds?: string[];
}

/**
 * Single page response from paginated orders endpoint
 */
export interface OrdersPage {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Grouped live orders by status
 */
export interface GroupedLiveOrders {
  [status: string]: Order[];
}

/**
 * Response type for paginated orders (infinite scroll)
 */
export interface PaginatedOrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Parameters for getLiveOrders service
 */
export interface GetLiveOrdersParams {
  businessId?: string;
  statuses?: OrderStatus[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  branchIds?: string[];
}

/**
 * Parameters for getCompletedOrders service
 */
export interface GetCompletedOrdersParams {
  businessId?: string;
  status?: "COMPLETED";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  branchIds?: string[];
  page?: number;
  limit?: number;
}

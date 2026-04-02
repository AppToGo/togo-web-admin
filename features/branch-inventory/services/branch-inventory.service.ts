/**
 * Branch Inventory Service
 * 
 * API service for branch inventory management.
 * Handles product activation, stock management, and price overrides per branch.
 * 
 * Backend endpoints:
 * - GET /businesses/:businessId/branches/:branchId/inventory
 * - POST /businesses/:businessId/branches/:branchId/inventory/:productId
 * - PATCH /businesses/:businessId/branches/:branchId/inventory/:productId
 * - DELETE /businesses/:businessId/branches/:branchId/inventory/:productId
 * - POST /businesses/:businessId/branches/:branchId/inventory/bulk-activate
 * - POST /businesses/:businessId/branches/:branchId/inventory/:productId/stock
 */

import apiClient from "@/services/api.service";
import type {
  InventoryItem,
  CreateInventoryDto,
  UpdateInventoryDto,
  BulkActivateDto,
  BulkActivateResponse,
  InventoryFilters,
  PaginatedInventory,
} from "../types";

/**
 * Get admin inventory for a branch (LEFT JOIN - shows all products)
 * GET /businesses/:businessId/branches/:branchId/inventory
 */
export async function getBranchInventory(
  businessId: string,
  branchId: string,
  filters?: InventoryFilters
): Promise<PaginatedInventory> {
  const params = new URLSearchParams();
  if (filters?.categoryId) params.append("categoryId", filters.categoryId);
  if (filters?.search) params.append("search", filters.search);
  if (filters?.isAvailable !== undefined)
    params.append("isAvailable", String(filters.isAvailable));
  if (filters?.isAvailable !== undefined)
    params.append("isAvailable", String(filters.isAvailable));
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.limit) params.append("limit", String(filters.limit));

  const queryString = params.toString();
  const url = `/businesses/${businessId}/branches/${branchId}/inventory${
    queryString ? `?${queryString}` : ""
  }`;

  const { data } = await apiClient.get<PaginatedInventory>(url);
  return data;
}

/**
 * Activate a product in a branch
 * POST /businesses/:businessId/branches/:branchId/inventory/:productId
 */
export async function activateProduct(
  businessId: string,
  branchId: string,
  productId: string,
  dto: CreateInventoryDto
): Promise<InventoryItem> {
  const { data } = await apiClient.post<InventoryItem>(
    `/businesses/${businessId}/branches/${branchId}/inventory/${productId}`,
    dto
  );
  return data;
}

/**
 * Update inventory for a product in a branch
 * PATCH /businesses/:businessId/branches/:branchId/inventory/:productId
 */
export async function updateInventory(
  businessId: string,
  branchId: string,
  productId: string,
  dto: UpdateInventoryDto
): Promise<InventoryItem> {
  const { data } = await apiClient.patch<InventoryItem>(
    `/businesses/${businessId}/branches/${branchId}/inventory/${productId}`,
    dto
  );
  return data;
}

/**
 * Deactivate a product in a branch
 * DELETE /businesses/:businessId/branches/:branchId/inventory/:productId
 */
export async function deactivateProduct(
  businessId: string,
  branchId: string,
  productId: string
): Promise<void> {
  await apiClient.delete(
    `/businesses/${businessId}/branches/${branchId}/inventory/${productId}`
  );
}

/**
 * Bulk activate products in a branch
 * POST /businesses/:businessId/branches/:branchId/inventory/bulk-activate
 */
export async function bulkActivate(
  businessId: string,
  branchId: string,
  dto: BulkActivateDto
): Promise<BulkActivateResponse> {
  const { data } = await apiClient.post<BulkActivateResponse>(
    `/businesses/${businessId}/branches/${branchId}/inventory/bulk-activate`,
    dto
  );
  return data;
}

/**
 * Update stock for a product (increment/decrement)
 * POST /businesses/:businessId/branches/:branchId/inventory/:productId/stock
 */
export async function updateStock(
  businessId: string,
  branchId: string,
  productId: string,
  quantity: number
): Promise<InventoryItem> {
  const { data } = await apiClient.post<InventoryItem>(
    `/businesses/${businessId}/branches/${branchId}/inventory/${productId}/stock`,
    { quantity }
  );
  return data;
}

/**
 * Set product availability
 * POST /businesses/:businessId/branches/:branchId/inventory/:productId/availability
 */
export async function setAvailability(
  businessId: string,
  branchId: string,
  productId: string,
  isAvailable: boolean
): Promise<InventoryItem> {
  const { data } = await apiClient.post<InventoryItem>(
    `/businesses/${businessId}/branches/${branchId}/inventory/${productId}/availability`,
    { isAvailable }
  );
  return data;
}

/**
 * Admin Catalog Service
 *
 * API service for Super Admin global product catalog management.
 *
 * Backend endpoints:
 * - GET /admin/global-products
 * - POST /admin/global-products
 * - GET /admin/global-products/:id
 * - PATCH /admin/global-products/:id
 * - DELETE /admin/global-products/:id
 * - GET /admin/global-products/:id/stats
 * - POST /admin/global-products/import
 * - GET /admin/global-products/stats
 * - GET /api/v1/admin/industries
 * - GET /api/v1/admin/industries/:id/categories
 *
 * Error Handling:
 * - Uses apiClient interceptors for auth (401 redirects)
 * - Error messages extracted from backend responses
 * - Network errors handled by axios interceptors
 */

import apiClient from "@/services/api.service";
import type {
  GlobalProduct,
  GlobalProductStats,
  CreateGlobalProductDto,
  UpdateGlobalProductDto,
  GlobalProductFilters,
  PaginatedGlobalProducts,
  GlobalCatalogStats,
  Industry,
  IndustryCategory,
  ImportJobDto,
  ImportItemDto,
  UpdateImportItemPayload,
} from "../types/admin-catalog.types";

// ============================================================================
// GLOBAL PRODUCTS API
// ============================================================================

/**
 * Get all global products with filters and pagination
 * GET /admin/global-products
 */
export async function getGlobalProducts(
  filters?: GlobalProductFilters
): Promise<PaginatedGlobalProducts> {
  const params = new URLSearchParams();
  if (filters?.industryIds?.length) params.append("industryIds", filters.industryIds.join(","));
  if (filters?.industryCategoryIds?.length) params.append("industryCategoryIds", filters.industryCategoryIds.join(","));
  if (filters?.brand) params.append("brand", filters.brand);
  if (filters?.search) params.append("search", filters.search);
  if (filters?.isActive !== undefined)
    params.append("isActive", String(filters.isActive));
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.limit) params.append("limit", String(filters.limit));
  if (filters?.sortBy) params.append("sortBy", filters.sortBy);
  if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

  const response = await apiClient.get<PaginatedGlobalProducts>(
    `/admin/global-products?${params}`
  );
  return response.data;
}

/**
 * Get a single global product by ID
 * GET /admin/global-products/:id
 */
export async function getGlobalProduct(id: string): Promise<GlobalProduct> {
  const response = await apiClient.get<GlobalProduct>(`/admin/global-products/${id}`);
  return response.data;
}

/**
 * Create a new global product
 * POST /admin/global-products
 */
export async function createGlobalProduct(
  data: CreateGlobalProductDto
): Promise<GlobalProduct> {
  const response = await apiClient.post<GlobalProduct>("/admin/global-products", data);
  return response.data;
}

/**
 * Update a global product
 * PATCH /admin/global-products/:id
 */
export async function updateGlobalProduct(
  id: string,
  data: UpdateGlobalProductDto
): Promise<GlobalProduct> {
  const response = await apiClient.patch<GlobalProduct>(`/admin/global-products/${id}`, data);
  return response.data;
}

/**
 * Delete a global product
 * DELETE /admin/global-products/:id
 */
export async function deleteGlobalProduct(id: string): Promise<void> {
  await apiClient.delete(`/admin/global-products/${id}`);
}

/**
 * Toggle global product status
 * PATCH /admin/global-products/:id/status
 */
export async function toggleGlobalProductStatus(
  id: string,
  isActive: boolean
): Promise<GlobalProduct> {
  return updateGlobalProduct(id, { isActive });
}

/**
 * Check if SKU is available
 * GET /admin/global-products/check-sku
 */
export async function checkSkuAvailability(
  sku: string,
  excludeId?: string
): Promise<{ available: boolean }> {
  const params = new URLSearchParams();
  params.append("sku", sku);
  if (excludeId) params.append("excludeId", excludeId);

  const response = await apiClient.get<{ available: boolean }>(
    `/admin/global-products/check-sku?${params}`
  );
  return response.data;
}

// ============================================================================
// STATISTICS API
// ============================================================================

/**
 * Get global product usage statistics
 * GET /admin/global-products/:id/stats
 */
export async function getGlobalProductStats(id: string): Promise<GlobalProductStats> {
  const response = await apiClient.get<GlobalProductStats>(`/admin/global-products/${id}/stats`);
  return response.data;
}

/**
 * Get global catalog statistics
 * GET /admin/global-products/stats
 */
export async function getGlobalCatalogStats(): Promise<GlobalCatalogStats> {
  const response = await apiClient.get<GlobalCatalogStats>("/admin/global-products/stats");
  return response.data;
}

// ============================================================================
// INDUSTRIES API
// ============================================================================

/**
 * Get all industries
 * GET /api/v1/admin/industries
 */
export async function getIndustries(): Promise<Industry[]> {
  const response = await apiClient.get<Industry[]>("/industries");
  return response.data;
}

/**
 * Get industry categories
 * GET /industry-categories?industryIds=
 */
export async function getIndustryCategories(industryIds: string[]): Promise<IndustryCategory[]> {
  const params = new URLSearchParams();
  if (industryIds.length) params.append("industryIds", industryIds.join(","));

  const response = await apiClient.get<IndustryCategory[]>(
    `/industry-categories?${params}`
  );
  return response.data;
}

/**
 * Get all brands (from existing products)
 * GET /admin/global-products/brands
 */
export async function getBrands(): Promise<string[]> {
  const response = await apiClient.get<string[]>("/admin/global-products/brands");
  return response.data;
}

// ============================================================================
// BULK IMPORT API
// ============================================================================
// IMPORT JOB API (staged flow)
// ============================================================================

/**
 * Create a new global import job by uploading a file
 * POST /admin/global-products/import
 */
export async function createGlobalImportJob(file: File): Promise<ImportJobDto> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<ImportJobDto>(
    "/admin/global-products/import",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

/**
 * Get import job status and items
 * GET /admin/global-products/import/:jobId
 */
export async function getGlobalImportJob(jobId: string): Promise<ImportJobDto> {
  const response = await apiClient.get<ImportJobDto>(
    `/admin/global-products/import/${jobId}`
  );
  return response.data;
}

/**
 * Update a single import item (e.g. toggle isSelected)
 * PATCH /admin/global-products/import/:jobId/items/:itemId
 */
export async function updateGlobalImportItem(
  jobId: string,
  itemId: string,
  payload: UpdateImportItemPayload
): Promise<ImportItemDto> {
  const response = await apiClient.patch<ImportItemDto>(
    `/admin/global-products/import/${jobId}/items/${itemId}`,
    payload
  );
  return response.data;
}

/**
 * Soft-delete an import item
 * DELETE /admin/global-products/import/:jobId/items/:itemId
 */
export async function deleteGlobalImportItem(
  jobId: string,
  itemId: string
): Promise<void> {
  await apiClient.delete(
    `/admin/global-products/import/${jobId}/items/${itemId}`
  );
}

/**
 * Confirm the import job with selected item IDs
 * POST /admin/global-products/import/:jobId/confirm
 */
export async function confirmGlobalImportJob(
  jobId: string,
  itemIds: string[]
): Promise<ImportJobDto> {
  const response = await apiClient.post<ImportJobDto>(
    `/admin/global-products/import/${jobId}/confirm`,
    { itemIds }
  );
  return response.data;
}

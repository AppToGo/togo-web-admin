/**
 * Catalog Service
 *
 * API service for product catalog management.
 * Integrated with real backend API.
 *
 * Backend endpoints:
 * - GET /api/v1/businesses/:businessId/products
 * - POST /api/v1/businesses/:businessId/products
 * - POST /api/v1/businesses/:businessId/products/activate
 * - GET /api/v1/businesses/:businessId/global-catalog
 * - GET /api/v1/businesses/:businessId/products/:id
 * - PATCH /api/v1/businesses/:businessId/products/:id
 * - DELETE /api/v1/businesses/:businessId/products/:id
 * - GET /api/v1/businesses/:businessId/categories
 * - GET/POST/PATCH/DELETE /api/v1/businesses/:businessId/categories/:id
 * - GET /api/v1/businesses/:businessId/catalog/stats
 *
 * Error Handling:
 * - Uses apiClient interceptors for auth (401 redirects)
 * - Error messages extracted from backend responses
 * - Network errors handled by axios interceptors
 */

import apiClient from "@/services/api.service";
import type {
  PaginatedGlobalCatalog,
  PaginatedBusinessProducts,
  GlobalProduct,
  BusinessProduct,
  BusinessCategory,
  CreateCustomProductDto,
  CreateSimpleProductDto,
  ActivateGlobalProductDto,
  UpdateProductDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  ProductFilters,
  GlobalCatalogFilters,
} from "../types/catalog.types";
import type { IndustryCategory } from "@/features/admin/industry-categories/types/industry-category.types";
import type { PaginatedResponse } from "@/types";

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate a URL-friendly slug from a name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ""); // Trim hyphens
}

/**
 * Generate a unique ID (for optimistic updates)
 */
function generateId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

// Toggle between mock and real API
// Set to true during development without backend
const USE_MOCK = false;

// ============================================================================
// MY PRODUCTS API
// ============================================================================

/**
 * Get all products for a business
 * GET /api/v1/businesses/:businessId/products
 */
export async function getMyProducts(
  businessId: string,
  filters?: ProductFilters
): Promise<PaginatedBusinessProducts> {
  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.categoryId) params.append("categoryId", filters.categoryId);
  if (filters?.isActive !== undefined)
    params.append("isActive", String(filters.isActive));
  if (filters?.isFromTemplate !== undefined)
    params.append("isFromTemplate", String(filters.isFromTemplate));
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.limit) params.append("limit", String(filters.limit));

  const response = await apiClient.get<PaginatedBusinessProducts>(
    `/businesses/${businessId}/products?${params}`
  );
  return response.data;
}

/**
 * Get a single product by ID
 * GET /api/v1/businesses/:businessId/products/:id
 */
export async function getProductById(
  businessId: string,
  productId: string
): Promise<BusinessProduct> {
  const response = await apiClient.get<BusinessProduct>(
    `/businesses/${businessId}/products/${productId}`
  );
  return response.data;
}

/**
 * Helper to convert simple product form data to backend format
 */
function convertSimpleToBackendDto(
  data: CreateSimpleProductDto
): CreateCustomProductDto & { initialInventory?: typeof data.initialInventory } {
  return {
    slug: generateSlug(data.name),
    price: data.price,
    stock: data.stock,
    categoryId: data.categoryId,
    customName: data.name,
    customDescription: data.description,
    customImage: data.image,
    isActive: true,
    isFeatured: false,
    initialInventory: data.initialInventory,
  };
}

/**
 * Create a custom product
 * POST /api/v1/businesses/:businessId/products
 */
export async function createCustomProduct(
  businessId: string,
  data: CreateCustomProductDto | CreateSimpleProductDto
): Promise<BusinessProduct> {
  // Convert simple DTO to backend format if needed
  const backendData =
    "slug" in data
      ? data
      : convertSimpleToBackendDto(data as CreateSimpleProductDto);

  const response = await apiClient.post<BusinessProduct>(
    `/businesses/${businessId}/products`,
    backendData
  );
  return response.data;
}

/**
 * Update a product
 * PATCH /api/v1/businesses/:businessId/products/:id
 */
export async function updateProduct(
  businessId: string,
  productId: string,
  data: UpdateProductDto
): Promise<BusinessProduct> {
  const response = await apiClient.patch<BusinessProduct>(
    `/businesses/${businessId}/products/${productId}`,
    data
  );
  return response.data;
}

/**
 * Delete a product
 * DELETE /api/v1/businesses/:businessId/products/:id
 */
export async function deleteProduct(
  businessId: string,
  productId: string
): Promise<void> {
  await apiClient.delete(`/businesses/${businessId}/products/${productId}`);
}

/**
 * Toggle product active status
 * Convenience method that calls updateProduct
 */
export async function toggleProductStatus(
  businessId: string,
  productId: string,
  isActive: boolean
): Promise<BusinessProduct> {
  return updateProduct(businessId, productId, { isActive });
}

// ============================================================================
// GLOBAL CATALOG API
// ============================================================================

/**
 * Get available global products
 * GET /api/v1/businesses/:businessId/global-catalog
 */
export async function getGlobalCatalog(
  businessId: string,
  filters?: GlobalCatalogFilters
): Promise<PaginatedGlobalCatalog> {
  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  // Categorías seleccionadas (CSV)
  // Nota: El backend automáticamente filtra por la industria del negocio
  if (filters?.industryCategoryIds) {
    params.append("industryCategoryIds", filters.industryCategoryIds);
  }
  if (filters?.brand) params.append("brand", filters.brand);
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.limit) params.append("limit", filters.limit.toString());

  const response = await apiClient.get<PaginatedGlobalCatalog>(
    `/businesses/${businessId}/global-catalog?${params}`
  );
  return response.data;
}

/**
 * Activate a product from the global catalog
 * POST /api/v1/businesses/:businessId/products/activate
 */
export async function activateGlobalProduct(
  businessId: string,
  data: ActivateGlobalProductDto & { name?: string } // name is optional for UI convenience
): Promise<BusinessProduct> {
  // Ensure slug is provided (backend requirement)
  const payload: ActivateGlobalProductDto = {
    ...data,
    slug: data.slug || generateSlug(data.name || ""),
  };

  const response = await apiClient.post<BusinessProduct>(
    `/businesses/${businessId}/products/activate`,
    payload
  );
  return response.data;
}

// ============================================================================
// CATEGORIES API
// ============================================================================

/**
 * Get all categories for a business
 * GET /api/v1/businesses/:businessId/business-categories
 */
export async function getCategories(
  businessId: string
): Promise<BusinessCategory[]> {
  const response = await apiClient.get<BusinessCategory[]>(
    `/businesses/${businessId}/business-categories?includeInactive=true`
  );
  return response.data;
}

/**
 * Get a single category by ID
 * GET /api/v1/businesses/:businessId/business-categories/:id
 */
export async function getCategoryById(
  businessId: string,
  categoryId: string
): Promise<BusinessCategory> {
  const response = await apiClient.get<BusinessCategory>(
    `/businesses/${businessId}/business-categories/${categoryId}`
  );
  return response.data;
}

/**
 * Create a new category
 * POST /api/v1/businesses/:businessId/business-categories
 */
export async function createCategory(
  businessId: string,
  data: CreateCategoryDto
): Promise<BusinessCategory> {
  const response = await apiClient.post<BusinessCategory>(
    `/businesses/${businessId}/business-categories?includeInactive=true`,
    data
  );
  return response.data;
}

/**
 * Update a category
 * PATCH /api/v1/businesses/:businessId/business-categories/:id
 */
export async function updateCategory(
  businessId: string,
  categoryId: string,
  data: UpdateCategoryDto
): Promise<BusinessCategory> {
  const response = await apiClient.patch<BusinessCategory>(
    `/businesses/${businessId}/business-categories/${categoryId}`,
    data
  );
  return response.data;
}

/**
 * Delete a category
 * DELETE /api/v1/businesses/:businessId/business-categories/:id
 */
export async function deleteCategory(
  businessId: string,
  categoryId: string
): Promise<void> {
  await apiClient.delete(
    `/businesses/${businessId}/business-categories/${categoryId}`
  );
}

/**
 * Toggle category active status
 * Convenience method that calls updateCategory
 */
export async function toggleCategoryStatus(
  businessId: string,
  categoryId: string,
  isActive: boolean
): Promise<BusinessCategory> {
  return updateCategory(businessId, categoryId, { isActive });
}

// ============================================================================
// INDUSTRY CATEGORIES API
// ============================================================================

/**
 * Get all industry categories (active only)
 * GET /api/v1/industry-categories
 */
export async function getIndustryCategories(): Promise<IndustryCategory[]> {
  const response = await apiClient.get<IndustryCategory[]>(
    "/industry-categories"
  );
  return response.data;
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get catalog statistics
 */
export async function getCatalogStats(businessId: string): Promise<{
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  fromTemplate: number;
  customProducts: number;
  categoriesCount: number;
}> {
  const response = await apiClient.get(
    `/businesses/${businessId}/catalog/stats`
  );
  return response.data;
}

// ============================================================================
// HYBRID INVENTORY API (Branch-specific product management)
// ============================================================================

import type {
  ProductWithBranchFilters,
  PaginatedProductsWithBranchStatus,
  BusinessProductWithAvailability,
  BulkBranchUpdateDto,
} from "../types/hybrid-catalog.types";

/**
 * Get products with branch filter (HYBRID approach)
 * GET /businesses/:businessId/products?branchId=X&activationStatus=activated|not_activated|all
 */
export async function getProductsWithBranchFilter(
  businessId: string,
  params: {
    branchId?: string;
    activationStatus?: "activated" | "not_activated" | "all";
    search?: string;
    categoryId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }
): Promise<PaginatedProductsWithBranchStatus> {
  const searchParams = new URLSearchParams();
  
  if (params.branchId) searchParams.append("branchId", params.branchId);
  if (params.activationStatus) searchParams.append("activationStatus", params.activationStatus);
  if (params.search) searchParams.append("search", params.search);
  if (params.categoryId) searchParams.append("categoryId", params.categoryId);
  if (params.isActive !== undefined) searchParams.append("isActive", String(params.isActive));
  if (params.page) searchParams.append("page", String(params.page));
  if (params.limit) searchParams.append("limit", String(params.limit));

  const response = await apiClient.get<PaginatedProductsWithBranchStatus>(
    `/businesses/${businessId}/products?${searchParams.toString()}`
  );
  return response.data;
}

/**
 * Get product with branch availability info
 * GET /businesses/:businessId/products/:productId?includeBranchAvailability=true
 */
export async function getProductWithBranchAvailability(
  businessId: string,
  productId: string
): Promise<BusinessProductWithAvailability> {
  const response = await apiClient.get<BusinessProductWithAvailability>(
    `/businesses/${businessId}/products/${productId}?includeBranchAvailability=true`
  );
  return response.data;
}

/**
 * Bulk update products in a branch
 * POST /businesses/:businessId/products/bulk-branch-update
 */
export async function bulkBranchUpdate(
  businessId: string,
  data: BulkBranchUpdateDto
): Promise<{ updated: number; errors: string[] }> {
  const response = await apiClient.post<{ updated: number; errors: string[] }>(
    `/businesses/${businessId}/products/bulk-branch-update`,
    data
  );
  return response.data;
}

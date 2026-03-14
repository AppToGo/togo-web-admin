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
): Promise<BusinessProduct[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.categoryId) params.append("categoryId", filters.categoryId);
  if (filters?.isActive !== undefined)
    params.append("isActive", String(filters.isActive));
  if (filters?.isFromTemplate !== undefined)
    params.append("isFromTemplate", String(filters.isFromTemplate));

  const response = await apiClient.get<BusinessProduct[]>(
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
): CreateCustomProductDto {
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
    "slug" in data ? data : convertSimpleToBackendDto(data as CreateSimpleProductDto);

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
): Promise<GlobalProduct[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.category) params.append("category", filters.category);
  if (filters?.brand) params.append("brand", filters.brand);

  const response = await apiClient.get<GlobalProduct[]>(
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
 * GET /api/v1/businesses/:businessId/categories
 */
export async function getCategories(
  businessId: string
): Promise<BusinessCategory[]> {
  const response = await apiClient.get<BusinessCategory[]>(
    `/businesses/${businessId}/categories`
  );
  return response.data;
}

/**
 * Get a single category by ID
 * GET /api/v1/businesses/:businessId/categories/:id
 */
export async function getCategoryById(
  businessId: string,
  categoryId: string
): Promise<BusinessCategory> {
  const response = await apiClient.get<BusinessCategory>(
    `/businesses/${businessId}/categories/${categoryId}`
  );
  return response.data;
}

/**
 * Create a new category
 * POST /api/v1/businesses/:businessId/categories
 */
export async function createCategory(
  businessId: string,
  data: CreateCategoryDto
): Promise<BusinessCategory> {
  const response = await apiClient.post<BusinessCategory>(
    `/businesses/${businessId}/categories`,
    data
  );
  return response.data;
}

/**
 * Update a category
 * PATCH /api/v1/businesses/:businessId/categories/:id
 */
export async function updateCategory(
  businessId: string,
  categoryId: string,
  data: UpdateCategoryDto
): Promise<BusinessCategory> {
  const response = await apiClient.patch<BusinessCategory>(
    `/businesses/${businessId}/categories/${categoryId}`,
    data
  );
  return response.data;
}

/**
 * Delete a category
 * DELETE /api/v1/businesses/:businessId/categories/:id
 */
export async function deleteCategory(
  businessId: string,
  categoryId: string
): Promise<void> {
  await apiClient.delete(`/businesses/${businessId}/categories/${categoryId}`);
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
  const response = await apiClient.get(`/businesses/${businessId}/catalog/stats`);
  return response.data;
}

/**
 * Branch Inventory Types
 * 
 * TypeScript definitions for the branch inventory management system.
 * Aligned with backend DTOs from api-togo/src/branch-inventory/dto
 */

/**
 * Inventory item as returned by the admin inventory endpoint (LEFT JOIN)
 * Shows all products with their branch status
 */
export interface InventoryItem {
  id: string;
  businessId: string;
  branchId: string;
  businessProductId: string;
  productName: string;
  productSlug: string;
  basePrice: number;
  stock: number | null;
  isAvailable: boolean;
  priceOverride: number | null;
  effectivePrice: number;
  productImage?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for creating/activating a product in a branch
 */
export interface CreateInventoryDto {
  stock?: number;
  isAvailable?: boolean;
  priceOverride?: number;
}

/**
 * DTO for updating inventory
 */
export interface UpdateInventoryDto {
  stock?: number;
  isAvailable?: boolean;
  priceOverride?: number;
}

/**
 * DTO for bulk activation
 */
export interface BulkActivateDto {
  productIds: string[];
  defaultStock?: number;
  defaultIsAvailable?: boolean;
}

/**
 * Response from bulk activation
 */
export interface BulkActivateResponse {
  created: number;
  existing: number;
  errors: string[];
}

/**
 * Initial inventory configuration for a branch
 * Used when creating a product to activate it in multiple branches
 */
export interface InitialInventory {
  branchId: string;
  isAvailable: boolean;
  priceOverride?: number;
  stock?: number;
}

/**
 * Filters for inventory list
 */
export interface InventoryFilters {
  categoryId?: string;
  search?: string;
  isAvailable?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Paginated inventory response
 */
export interface PaginatedInventory {
  items: InventoryItem[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Branch summary for selector
 */
export interface BranchSummary {
  id: string;
  name: string;
  code: string;
  isMainBranch: boolean;
}

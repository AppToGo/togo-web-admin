/**
 * Catalog Types
 *
 * TypeScript definitions for the normalized product catalog system.
 * Supports the Rappi-style architecture: GlobalProduct + BusinessProduct
 */

/**
 * Paginated response structure
 */
export interface PaginatedGlobalCatalog {
  items: GlobalProduct[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================================================
// GLOBAL PRODUCTS (Catalogo TOGO)
// ============================================================================

/**
 * GlobalProduct - Master product definition managed by TOGO
 * These are template products that businesses can activate
 */
export interface GlobalProduct {
  id: string;
  sku: string;
  name: string;
  description?: string;
  image?: string;
  brand?: string;
  category?: string;
  basePrice?: number; // Suggested retail price
  unit?: string; // e.g., "350ml", "500g", "unidad"
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// BUSINESS PRODUCTS (Mis Productos)
// ============================================================================

/**
 * BusinessProduct - A product that belongs to a specific business
 * Can be:
 * 1. Created from a GlobalProduct template (isFromTemplate = true)
 * 2. Custom created by the business (isFromTemplate = false)
 */
export interface BusinessProduct {
  id: string;
  businessId: string;

  // Reference to global product (null = custom product)
  globalProductId?: string | null;
  globalProduct?: GlobalProduct | null;

  // Product details (can override global product values)
  name: string; // Computed: customName || globalProduct.name
  description?: string; // Computed: customDescription || globalProduct.description
  price: number;
  stock?: number | null;
  image?: string | null; // Computed: customImage || globalProduct.image

  // Backend fields for overrides
  customName?: string;
  customDescription?: string;
  customImage?: string | null;
  customAttributes?: Record<string, unknown>;

  // Product metadata
  slug: string;
  internalSku?: string;
  isFeatured: boolean;

  // Categorization
  categoryId?: string | null;
  industryCategoryId?: string | null;
  category?: BusinessCategory | null;
  industryCategory?: { id: string; name: string; slug: string } | null;

  // Status
  isActive: boolean;
  isFromTemplate: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CATEGORIES
// ============================================================================

/**
 * BusinessCategory - Categories defined by each business
 * Aligned with backend BusinessCategory model
 */
export interface BusinessCategory {
  id: string;
  name: string;
  description: string | null;
  slug: string; // URL-friendly identifier
  industryCategoryId: string; // Reference to IndustryCategory
  industryCategoryName?: string; // Optional display name
  businessId: string;
  isActive: boolean;
  order: number; // Renamed from sortOrder
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * DTO for creating a custom product
 * Aligned with backend CreateBusinessProductDto
 */
export interface CreateCustomProductDto {
  slug: string;
  price: number;
  stock?: number;
  categoryId?: string;
  industryCategoryId?: string;
  internalSku?: string;
  // Custom overrides
  customName?: string;
  customDescription?: string;
  customImage?: string;
  customAttributes?: Record<string, unknown>;
  isActive?: boolean;
  isFeatured?: boolean;
}

/**
 * DTO for creating a custom product (legacy/simple form)
 * Used for UI forms that only collect basic info
 */
export interface CreateSimpleProductDto {
  name: string;
  price: number;
  stock?: number;
  description?: string;
  image?: string;
  categoryId?: string;
  industryCategoryId?: string;
  initialInventory?: {
    branchId: string;
    isAvailable: boolean;
    priceOverride?: number;
    stock?: number;
  }[];
}

/**
 * DTO for activating a product from the global catalog
 * Aligned with backend ActivateGlobalProductDto
 */
export interface ActivateGlobalProductDto {
  globalProductId: string;
  slug: string;
  price: number;
  stock?: number;
  categoryId?: string;
  industryCategoryId?: string;
  internalSku?: string;
  initialInventory?: {
    branchId: string;
    isAvailable: boolean;
    priceOverride?: number;
    stock?: number;
  }[];
}

/**
 * DTO for updating a business product
 * Aligned with backend UpdateBusinessProductDto (Partial of CreateBusinessProductDto)
 * NOTE: branchInventory is NOT included here - use bulkBranchUpdate for inventory updates
 */
export interface UpdateProductDto {
  slug?: string;
  price?: number;
  stock?: number | null;
  categoryId?: string | null;
  industryCategoryId?: string | null;
  internalSku?: string;
  // Custom overrides
  customName?: string;
  customDescription?: string;
  customImage?: string | null;
  customAttributes?: Record<string, unknown>;
  isActive?: boolean;
  isFeatured?: boolean;
}

/**
 * DTO for creating a category
 * Aligned with backend CreateBusinessCategoryDto
 */
export interface CreateCategoryDto {
  name: string;
  description?: string;
  slug: string;
  industryCategoryId: string;
}

/**
 * DTO for updating a category
 * Aligned with backend UpdateBusinessCategoryDto
 */
export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  slug?: string;
  industryCategoryId?: string;
  order?: number;
  isActive?: boolean;
}

// ============================================================================
// FILTER AND PAGINATION TYPES
// ============================================================================

/**
 * Filters for product lists
 */
export interface ProductFilters {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  isFromTemplate?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Paginated response for business products
 */
export interface PaginatedBusinessProducts {
  items: BusinessProduct[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Filters for global catalog
 */
export interface GlobalCatalogFilters {
  search?: string;
  // Nota: El backend automáticamente filtra por la industria del negocio via businessId
  industryCategoryIds?: string;  // CSV: "id1,id2,id3" (multiselect)
  brand?: string;
  page?: number;
  limit?: number;
}

/**
 * Filters for category lists
 */
export interface CategoryFilters {
  name?: string;
  isActive?: boolean | null; // null = todos
  industryCategoryId?: string;
}

// ============================================================================
// UI COMPONENT PROP TYPES
// ============================================================================

/**
 * Props for product card components
 */
export interface ProductCardProps {
  product: BusinessProduct;
  onEdit?: (product: BusinessProduct) => void;
  onDelete?: (product: BusinessProduct) => void;
  onToggleStatus?: (product: BusinessProduct) => void;
}

/**
 * Props for global product card
 */
export interface GlobalProductCardProps {
  product: GlobalProduct;
  onActivate?: (product: GlobalProduct) => void;
}

/**
 * Props for product form (create/edit)
 */
export interface ProductFormProps {
  product?: BusinessProduct | null;
  categories: BusinessCategory[];
  onSubmit: (data: CreateCustomProductDto | UpdateProductDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Props for activation modal
 */
export interface ActivateProductModalProps {
  product: GlobalProduct | null;
  categories: BusinessCategory[];
  isOpen: boolean;
  onClose: () => void;
  onActivate: (data: ActivateGlobalProductDto) => void;
  isLoading?: boolean;
}

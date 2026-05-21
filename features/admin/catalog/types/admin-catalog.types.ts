/**
 * Admin Catalog Types
 * 
 * TypeScript definitions for Super Admin global product catalog management.
 * These types extend the base catalog types with admin-specific fields.
 */

// ============================================================================
// GLOBAL PRODUCT (Admin View)
// ============================================================================

/**
 * Industry definition for global products
 */
export interface Industry {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Industry Category - Subcategories that can belong to multiple industries
 */
export interface IndustryCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
  icon?: string;
  color?: string;
  isActive: boolean;
  industries: Array<{
    id: string;
    name: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Variant of a global product with suggested price
 */
export interface GlobalProductVariant {
  id: string;
  variantLabel: string;
  suggestedPrice?: number;
  isDefault: boolean;
}

/**
 * GlobalProduct - Master product definition managed by TOGO Super Admin
 * Includes usage statistics and full attribute support
 */
export interface GlobalProduct {
  id: string;
  sku: string; // Unique identifier (e.g., "COCA-COLA-350ML")
  name: string;
  description?: string;
  image?: string;
  brand?: string;
  industryId?: string; // Opcional - se deriva de industryCategoryId
  industry?: Industry;
  industryCategoryId?: string;
  industryCategory?: IndustryCategory;
  attributes?: Record<string, unknown>; // Flexible attributes (JSON)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  // Usage statistics
  _count?: {
    businessProducts: number;
  };
  // Extended stats (fetched separately)
  stats?: GlobalProductStats;
  // Active variants with suggested price
  variants?: GlobalProductVariant[];
}

/**
 * Global product usage statistics
 */
export interface GlobalProductStats {
  totalActivations: number;
  byIndustry: Record<string, number>; // { "pharmacy": 80, "minimarket": 20 }
  byBusinessType: Record<string, number>;
  lastActivatedAt?: string;
  topBusinesses?: {
    businessId: string;
    businessName: string;
    count: number;
  }[];
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * DTO for creating a global product
 */
export interface CreateGlobalProductDto {
  sku: string;
  name: string;
  description?: string;
  image?: string;
  brand?: string;
  industryId?: string; // Opcional - se deriva de industryCategoryId en el backend
  industryCategoryId: string;
  attributes?: Record<string, unknown>;
  isActive?: boolean;
}

/**
 * DTO for updating a global product
 */
export interface UpdateGlobalProductDto {
  sku?: string;
  name?: string;
  description?: string;
  image?: string;
  brand?: string;
  industryId?: string; // Opcional - se deriva de industryCategoryId en el backend
  industryCategoryId?: string;
  attributes?: Record<string, unknown>;
  isActive?: boolean;
}

/**
 * Filters for global product lists
 */
export interface GlobalProductFilters {
  industryIds?: string[];
  industryCategoryIds?: string[];
  brand?: string;
  search?: string; // Searches SKU and name
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Paginated response for global products
 */
export interface PaginatedGlobalProducts {
  data: GlobalProduct[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================================================
// ADMIN DASHBOARD STATS
// ============================================================================

/**
 * Global catalog statistics for admin dashboard
 */
export interface GlobalCatalogStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  productsByIndustry: {
    industryId: string;
    industryName: string;
    count: number;
  }[];
  topBrands: {
    brand: string;
    count: number;
  }[];
  mostActivatedProducts: {
    productId: string;
    sku: string;
    name: string;
    activationCount: number;
  }[];
  recentActivity: {
    action: "created" | "updated" | "deleted" | "activated";
    productId: string;
    productName: string;
    userId: string;
    userName: string;
    timestamp: string;
  }[];
}

// ============================================================================
// UI COMPONENT PROP TYPES
// ============================================================================

/**
 * Props for global product form (create/edit)
 */
export interface GlobalProductFormProps {
  product?: GlobalProduct | null;
  industries: Industry[];
  onSubmit: (data: CreateGlobalProductDto | UpdateGlobalProductDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Props for global product card
 */
export interface AdminGlobalProductCardProps {
  product: GlobalProduct;
  onEdit?: (product: GlobalProduct) => void;
  onDelete?: (product: GlobalProduct) => void;
  onToggleStatus?: (product: GlobalProduct, isActive: boolean) => void;
  viewMode?: "grid" | "list";
}

/**
 * Props for JSON attributes editor
 */
export interface JsonAttributesEditorProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  disabled?: boolean;
}

/**
 * Props for image upload component
 */
export interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  onFileSelect?: (file: File) => void;
  disabled?: boolean;
  previewClassName?: string;
}

// ============================================================================
// FORM STATE TYPES
// ============================================================================

/**
 * Form state for GlobalProductForm (internal UI state)
 */
export interface GlobalProductFormState {
  sku: string;
  name: string;
  description: string;
  image: string;
  brand: string;
  industryCategoryId: string;
  attributes: Record<string, unknown>;
  isActive: boolean;
}

// ============================================================================
// IMPORT JOB TYPES (staged flow)
// ============================================================================

export type ProductImportStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'READY_FOR_REVIEW'
  | 'CONFIRMING'
  | 'COMPLETED'
  | 'FAILED';

export type ProductImportSource = 'EXCEL' | 'CSV' | 'PDF' | 'IMAGE';

export type ProductImportTarget = 'BUSINESS_PRODUCT' | 'GLOBAL_PRODUCT';

export interface ImportItemDto {
  id: string;
  jobId: string;
  businessId: string | null;
  name: string;
  description: string | null;
  price: number | null;
  rawCategory: string | null;
  businessCategoryId: string | null;
  suggestedGlobalProductId: string | null;
  suggestedGlobalProductName: string | null;
  matchScore: number | null;
  isSelected: boolean;
  importedProductId: string | null;
  importedGlobalProductId: string | null;
  importError: string | null;
  sku: string | null;
  brand: string | null;
  imageUrl: string | null;
  industryCategoryId: string | null;
  attributes: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImportJobDto {
  id: string;
  businessId: string | null;
  target: ProductImportTarget;
  uploadedByUserId: string | null;
  source: ProductImportSource;
  status: ProductImportStatus;
  fileName: string;
  fileSize: number;
  mimeType: string;
  totalDetected: number;
  totalImported: number;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  items: ImportItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedImportJobsDto {
  items: ImportJobDto[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateImportItemPayload {
  name?: string;
  description?: string;
  price?: number;
  sku?: string;
  brand?: string;
  imageUrl?: string;
  industryCategoryId?: string;
  isSelected?: boolean;
  attributes?: Record<string, unknown>;
}

export interface ConfirmImportPayload {
  itemIds: string[];
}

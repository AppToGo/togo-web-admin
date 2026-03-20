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
  industryCategoryId: string; // Ahora obligatorio
  industryCategory?: IndustryCategory;
  attributes?: Record<string, any>; // Flexible attributes (JSON)
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
  industryCategoryId: string; // Ahora obligatorio
  attributes?: Record<string, any>;
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
  attributes?: Record<string, any>;
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
// BULK IMPORT TYPES
// ============================================================================

/**
 * CSV import row structure
 */
export interface ImportProductRow {
  sku: string;
  name: string;
  description?: string;
  brand?: string;
  industryId: string;
  industryCategoryId?: string;
  imageUrl?: string;
  attributes?: string; // JSON string
}

/**
 * Import validation result
 */
export interface ImportValidationResult {
  row: number;
  sku: string;
  name: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Bulk import result
 */
export interface BulkImportResult {
  success: boolean;
  totalRows: number;
  imported: number;
  failed: number;
  skipped: number;
  results: {
    row: number;
    sku: string;
    success: boolean;
    error?: string;
    productId?: string;
  }[];
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
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
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
  attributes: Record<string, string>;
  isActive: boolean;
}

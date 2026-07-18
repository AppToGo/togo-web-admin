/**
 * Catalog Types
 */

export type {
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
  PaginatedGlobalCatalog,
  ProductCardProps,
  GlobalProductCardProps,
  ProductFormProps,
  GlobalProductVariant,
  AttributeSchema,
  CatalogProduct,
  ProductVariant,
  CreateProductDto,
  ActivateCatalogProductDto,
  UpdateCatalogProductDto,
  CreateVariantDto,
  UpdateVariantDto,
  PaginatedProducts,
} from "./catalog.types";

/**
 * Hybrid Catalog Types (Inventory by Branch)
 */
export type {
  BranchAvailability,
  BusinessProductWithAvailability,
  ProductWithBranchFilters,
  BulkBranchUpdateDto,
  PaginatedProductsWithBranchStatus,
  BusinessProductWithBranchInfo,
  ProductFiltersWithBranchProps,
} from "./hybrid-catalog.types";

/**
 * Catalog Hooks
 */

// Export translations hook and types
export {
  useCatalogTranslations,
  type CatalogToastMessages,
} from "./useCatalogTranslations";

export {
  // Query keys
  catalogKeys,
  // Products
  useMyProducts,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useToggleProductStatus,
  // Global Catalog
  useGlobalCatalog,
  useActivateGlobalProduct,
  // Categories
  useCategories,
  useCategory,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useToggleCategoryStatus,
  useRegenerateCategoryKeywords,
  // Industry Categories
  useIndustryCategories,
  // Business
  useBusiness,
  // Stats
  useCatalogStats,
  // Hybrid Inventory Hooks
  useProductsWithBranchFilter,
  useProductWithBranchAvailability,
  useBulkBranchUpdate,
  // Catalog Product Hooks
  useCatalogProducts,
  useCatalogProduct,
  useCreateCatalogProduct,
  useActivateCatalogProduct,
  useUpdateCatalogProduct,
  useRegenerateCatalogProductKeywords,
  useDeleteCatalogProduct,
  useVariants,
  useCreateVariant,
  useUpdateVariant,
  useDeleteVariant,
  useIndustryCategoryVariantTemplates,
  useIndustryCategoriesByIndustry,
} from "./useCatalog";

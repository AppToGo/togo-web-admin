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
  // Industry Categories
  useIndustryCategories,
  // Stats
  useCatalogStats,
} from "./useCatalog";

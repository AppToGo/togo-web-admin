/**
 * Admin Catalog Hooks
 */

export { useAdminCatalogTranslations } from "./useAdminCatalogTranslations";

export {
  // Query keys
  adminCatalogKeys,
  // Global Products
  useGlobalProducts,
  useGlobalProduct,
  useCreateGlobalProduct,
  useUpdateGlobalProduct,
  useDeleteGlobalProduct,
  useToggleGlobalProductStatus,
  useCheckSkuAvailability,
  // Statistics
  useGlobalProductStats,
  useGlobalCatalogStats,
  // Industries
  useIndustries,
  useIndustryCategoriesByIds,
  useBrands,
  // Bulk Import
  useBulkImportProducts,
} from "./useAdminCatalog";

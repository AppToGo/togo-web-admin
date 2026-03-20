/**
 * Admin Catalog Hooks
 * 
 * React Query hooks for Super Admin global product catalog management.
 * 
 * Translation keys are accessed via useTranslations('admin-catalog') internally.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type {
  GlobalProduct,
  GlobalProductStats,
  CreateGlobalProductDto,
  UpdateGlobalProductDto,
  GlobalProductFilters,
  PaginatedGlobalProducts,
  BulkImportResult,
  GlobalCatalogStats,
  Industry,
  IndustryCategory,
} from "../types/admin-catalog.types";
import * as adminCatalogService from "../services/admin-catalog.service";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const adminCatalogKeys = {
  all: ["admin-catalog"] as const,
  products: () => [...adminCatalogKeys.all, "products"] as const,
  product: (id: string) => [...adminCatalogKeys.products(), id] as const,
  productStats: (id: string) => [...adminCatalogKeys.product(id), "stats"] as const,
  industries: () => [...adminCatalogKeys.all, "industries"] as const,
  industryCategories: (industryIds: string[]) =>
    [...adminCatalogKeys.industries(), JSON.stringify(industryIds), "categories"] as const,
  brands: () => [...adminCatalogKeys.all, "brands"] as const,
  stats: () => [...adminCatalogKeys.all, "stats"] as const,
};

// ============================================================================
// GLOBAL PRODUCTS HOOKS
// ============================================================================

/**
 * Hook to fetch global products with filters and pagination
 */
export function useGlobalProducts(
  filters?: GlobalProductFilters,
  options?: UseQueryOptions<PaginatedGlobalProducts, Error>
) {
  return useQuery({
    queryKey: [...adminCatalogKeys.products(), filters],
    queryFn: () => adminCatalogService.getGlobalProducts(filters),
    ...options,
  });
}

/**
 * Hook to fetch a single global product
 */
export function useGlobalProduct(
  id: string,
  options?: UseQueryOptions<GlobalProduct, Error>
) {
  return useQuery({
    queryKey: adminCatalogKeys.product(id),
    queryFn: () => adminCatalogService.getGlobalProduct(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to create a global product
 */
export function useCreateGlobalProduct() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-catalog");

  return useMutation({
    mutationFn: (data: CreateGlobalProductDto) =>
      adminCatalogService.createGlobalProduct(data),
    onSuccess: () => {
      toast.success(t("notifications.globalProductCreated"));
      queryClient.invalidateQueries({
        queryKey: adminCatalogKeys.products(),
      });
      queryClient.invalidateQueries({
        queryKey: adminCatalogKeys.stats(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("errors.createProduct"));
    },
  });
}

/**
 * Hook to update a global product
 */
export function useUpdateGlobalProduct() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-catalog");

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateGlobalProductDto;
    }) => adminCatalogService.updateGlobalProduct(id, data),
    onSuccess: (_, variables) => {
      toast.success(t("notifications.globalProductUpdated"));
      queryClient.invalidateQueries({
        queryKey: adminCatalogKeys.products(),
      });
      queryClient.invalidateQueries({
        queryKey: adminCatalogKeys.product(variables.id),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("errors.updateProduct"));
    },
  });
}

/**
 * Hook to delete a global product
 */
export function useDeleteGlobalProduct() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-catalog");

  return useMutation({
    mutationFn: (id: string) => adminCatalogService.deleteGlobalProduct(id),
    onSuccess: () => {
      toast.success(t("notifications.globalProductDeleted"));
      queryClient.invalidateQueries({
        queryKey: adminCatalogKeys.products(),
      });
      queryClient.invalidateQueries({
        queryKey: adminCatalogKeys.stats(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("errors.deleteProduct"));
    },
  });
}

/**
 * Hook to toggle global product status
 */
export function useToggleGlobalProductStatus() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-catalog");

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminCatalogService.toggleGlobalProductStatus(id, isActive),
    onSuccess: (_, variables) => {
      const successMessage = variables.isActive
        ? t("notifications.productActivated")
        : t("notifications.productDeactivated");
      toast.success(successMessage);
      queryClient.invalidateQueries({
        queryKey: adminCatalogKeys.products(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("errors.changeStatus"));
    },
  });
}

/**
 * Hook to check SKU availability
 */
export function useCheckSkuAvailability(sku: string, excludeId?: string) {
  return useQuery({
    queryKey: [...adminCatalogKeys.all, "check-sku", sku, excludeId],
    queryFn: () => adminCatalogService.checkSkuAvailability(sku, excludeId),
    enabled: !!sku && sku.length >= 3,
    staleTime: 1000 * 60, // 1 minute
  });
}

// ============================================================================
// STATISTICS HOOKS
// ============================================================================

/**
 * Hook to fetch global product usage statistics
 */
export function useGlobalProductStats(
  id: string,
  options?: UseQueryOptions<GlobalProductStats, Error>
) {
  return useQuery({
    queryKey: adminCatalogKeys.productStats(id),
    queryFn: () => adminCatalogService.getGlobalProductStats(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch global catalog statistics
 */
export function useGlobalCatalogStats(
  options?: UseQueryOptions<GlobalCatalogStats, Error>
) {
  return useQuery({
    queryKey: adminCatalogKeys.stats(),
    queryFn: () => adminCatalogService.getGlobalCatalogStats(),
    ...options,
  });
}

// ============================================================================
// INDUSTRIES HOOKS
// ============================================================================

/**
 * Hook to fetch all industries
 */
export function useIndustries(options?: UseQueryOptions<Industry[], Error>) {
  return useQuery({
    queryKey: adminCatalogKeys.industries(),
    queryFn: () => adminCatalogService.getIndustries(),
    ...options,
  });
}

/**
 * Hook to fetch industry categories by industry IDs
 */
export function useIndustryCategoriesByIds(
  industryIds: string[],
  options?: UseQueryOptions<IndustryCategory[], Error>
) {
  return useQuery({
    queryKey: adminCatalogKeys.industryCategories(industryIds),
    queryFn: () => adminCatalogService.getIndustryCategories(industryIds),
    enabled: industryIds.length > 0,
    ...options,
  });
}

/**
 * Hook to fetch all brands
 */
export function useBrands(options?: UseQueryOptions<string[], Error>) {
  return useQuery({
    queryKey: adminCatalogKeys.brands(),
    queryFn: () => adminCatalogService.getBrands(),
    ...options,
  });
}

// ============================================================================
// BULK IMPORT HOOKS
// ============================================================================

/**
 * Hook to bulk import products
 */
export function useBulkImportProducts() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-catalog");

  return useMutation({
    mutationFn: (file: File) => adminCatalogService.bulkImportProducts(file),
    onSuccess: (result: BulkImportResult) => {
      if (result.success) {
        toast.success(
          t("notifications.importCompleted", { count: result.imported })
        );
        if (result.failed > 0) {
          toast.error(
            t("notifications.productsFailed", { count: result.failed })
          );
        }
      } else {
        toast.error(t("notifications.importFailed"));
      }
      queryClient.invalidateQueries({
        queryKey: adminCatalogKeys.products(),
      });
      queryClient.invalidateQueries({
        queryKey: adminCatalogKeys.stats(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("errors.importProducts"));
    },
  });
}

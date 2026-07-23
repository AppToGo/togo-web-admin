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
  GlobalCatalogStats,
  Industry,
  IndustryCategory,
  ImportJobDto,
  ImportItemDto,
  UpdateImportItemPayload,
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
    [...adminCatalogKeys.industries(), JSON.stringify([...industryIds].sort()), "categories"] as const,
  brands: () => [...adminCatalogKeys.all, "brands"] as const,
  stats: () => [...adminCatalogKeys.all, "stats"] as const,
  importJob: (jobId: string) => [...adminCatalogKeys.all, "import-job", jobId] as const,
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
    queryKey: adminCatalogKeys.industryCategories([...industryIds].sort()),
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
// IMPORT JOB HOOKS (staged flow)
// ============================================================================

/**
 * Hook to create a new global import job (upload file)
 */
export function useCreateGlobalImportJob() {
  return useMutation({
    mutationFn: (file: File) => adminCatalogService.createGlobalImportJob(file),
  });
}

/**
 * Hook to poll a global import job until it's ready for review
 * Automatically polls every 2s when status is PENDING or PROCESSING
 */
export function useGlobalImportJob(jobId: string | null, enabled: boolean) {
  return useQuery<ImportJobDto, Error>({
    queryKey: jobId ? adminCatalogKeys.importJob(jobId) : ["admin-catalog", "import-job", "none"],
    queryFn: () => adminCatalogService.getGlobalImportJob(jobId!),
    enabled: !!jobId && enabled,
    // CONFIRMING se incluye porque confirmJob() ahora encola la creación de
    // productos en un worker async y responde de inmediato — sin esto, la UI
    // no se enteraría cuando el job realmente termine (ver useConfirmGlobalImportJob).
    refetchInterval: (query) =>
      ["PENDING", "PROCESSING", "CONFIRMING"].includes(query.state.data?.status ?? "")
        ? 2000
        : false,
  });
}

/**
 * Hook to update a single import item (e.g. toggle isSelected, edit fields)
 */
export function useUpdateGlobalImportItem() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-catalog");

  return useMutation({
    mutationFn: ({
      jobId,
      itemId,
      payload,
    }: {
      jobId: string;
      itemId: string;
      payload: UpdateImportItemPayload;
    }) => adminCatalogService.updateGlobalImportItem(jobId, itemId, payload),
    onSuccess: (updatedItem: ImportItemDto) => {
      queryClient.setQueryData<ImportJobDto>(
        adminCatalogKeys.importJob(updatedItem.jobId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === updatedItem.id ? updatedItem : item
            ),
          };
        }
      );
    },
    onError: (error: Error, variables) => {
      toast.error(error.message || t("errors.importProducts"));
      queryClient.invalidateQueries({
        queryKey: adminCatalogKeys.importJob(variables.jobId),
      });
    },
  });
}

/**
 * Hook to soft-delete an import item
 */
export function useDeleteGlobalImportItem() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-catalog");

  return useMutation({
    mutationFn: ({ jobId, itemId }: { jobId: string; itemId: string }) =>
      adminCatalogService.deleteGlobalImportItem(jobId, itemId),
    onSuccess: (_, variables) => {
      queryClient.setQueryData<ImportJobDto>(
        adminCatalogKeys.importJob(variables.jobId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter((item) => item.id !== variables.itemId),
          };
        }
      );
    },
    onError: (error: Error, variables) => {
      toast.error(error.message || t("errors.importProducts"));
      queryClient.invalidateQueries({
        queryKey: adminCatalogKeys.importJob(variables.jobId),
      });
    },
  });
}

/**
 * Hook to confirm a global import job with selected item IDs
 *
 * confirmJob() en el backend ahora solo valida + encola la creación de
 * productos en un worker async — la respuesta siempre es el job en estado
 * CONFIRMING, nunca el resultado final. Por eso ya no invalidamos products()/
 * stats() acá (todavía no se creó nada): eso pasa en el efecto de ResultsStep
 * cuando el polling de useGlobalImportJob detecta que el job llegó a COMPLETED.
 */
export function useConfirmGlobalImportJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, itemIds }: { jobId: string; itemIds: string[] }) =>
      adminCatalogService.confirmGlobalImportJob(jobId, itemIds),
    onSuccess: (confirmedJob: ImportJobDto) => {
      // Escribe el snapshot (CONFIRMING) de una vez en la cache para que
      // ResultsStep no muestre un parpadeo de "sin datos" antes del primer poll.
      queryClient.setQueryData<ImportJobDto>(
        adminCatalogKeys.importJob(confirmedJob.id),
        confirmedJob
      );
    },
  });
}

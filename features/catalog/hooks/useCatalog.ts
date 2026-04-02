/**
 * Catalog Hooks
 *
 * React Query hooks for catalog management
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  BusinessProduct,
  GlobalProduct,
  BusinessCategory,
  CreateCustomProductDto,
  ActivateGlobalProductDto,
  UpdateProductDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  ProductFilters,
  GlobalCatalogFilters,
  PaginatedGlobalCatalog,
  PaginatedBusinessProducts,
} from "../types/catalog.types";
import type { IndustryCategory } from "@/features/admin/industry-categories/types/industry-category.types";
import type { Business } from "@/types";
import * as catalogService from "../services/catalog.service";
import apiClient from "@/services/api.service";
import type { CatalogToastMessages } from "./useCatalogTranslations";
import type {
  PaginatedProductsWithBranchStatus,
  BusinessProductWithAvailability,
  BulkBranchUpdateDto,
} from "../types/hybrid-catalog.types";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const catalogKeys = {
  all: ["catalog"] as const,
  products: (businessId: string) =>
    [...catalogKeys.all, "products", businessId] as const,
  product: (businessId: string, productId: string) =>
    [...catalogKeys.products(businessId), productId] as const,
  globalCatalog: (businessId: string) =>
    [...catalogKeys.all, "global-catalog", businessId] as const,
  categories: (businessId: string) =>
    [...catalogKeys.all, "categories", businessId] as const,
  category: (businessId: string, categoryId: string) =>
    [...catalogKeys.categories(businessId), categoryId] as const,
  industryCategories: () =>
    [...catalogKeys.all, "industry-categories"] as const,
  stats: (businessId: string) =>
    [...catalogKeys.all, "stats", businessId] as const,
  business: (businessId: string) =>
    [...catalogKeys.all, "business", businessId] as const,
};

// ============================================================================
// PRODUCTS HOOKS
// ============================================================================

/**
 * Hook to fetch all business products
 */
export function useMyProducts(
  businessId: string,
  filters?: ProductFilters,
  options?: UseQueryOptions<PaginatedBusinessProducts, Error>
) {
  return useQuery({
    queryKey: [...catalogKeys.products(businessId), filters],
    queryFn: () => catalogService.getMyProducts(businessId, filters),
    enabled: !!businessId,
    ...options,
  });
}

/**
 * Hook to fetch a single product
 */
export function useProduct(
  businessId: string,
  productId: string,
  options?: UseQueryOptions<BusinessProduct, Error>
) {
  return useQuery({
    queryKey: catalogKeys.product(businessId, productId),
    queryFn: () => catalogService.getProductById(businessId, productId),
    enabled: !!businessId && !!productId,
    ...options,
  });
}

/**
 * Hook to create a custom product
 *
 * @param businessId - The business ID
 * @param messages - Optional translated toast messages. Use useCatalogTranslations() hook to get these
 *
 * @example
 * ```tsx
 * const messages = useCatalogTranslations();
 * const createProduct = useCreateProduct(businessId, messages);
 * ```
 */
export function useCreateProduct(
  businessId: string,
  messages?: Partial<CatalogToastMessages>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomProductDto) =>
      catalogService.createCustomProduct(businessId, data),
    onSuccess: () => {
      toast.success(messages?.productCreated ?? "Producto creado exitosamente");
      queryClient.invalidateQueries({
        queryKey: catalogKeys.products(businessId),
      });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.stats(businessId),
      });
    },
    onError: (error: Error) => {
      toast.error(
        error.message ||
          messages?.errorCreatingProduct ||
          "Error al crear el producto"
      );
    },
  });
}

/**
 * Hook to update a product
 *
 * @param businessId - The business ID
 * @param messages - Optional translated toast messages. Use useCatalogTranslations() hook to get these
 *
 * @example
 * ```tsx
 * const messages = useCatalogTranslations();
 * const updateProduct = useUpdateProduct(businessId, messages);
 * ```
 */
export function useUpdateProduct(
  businessId: string,
  messages?: Partial<CatalogToastMessages>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: UpdateProductDto;
    }) => catalogService.updateProduct(businessId, productId, data),
    onSuccess: (_, variables) => {
      toast.success(
        messages?.productUpdated ?? "Producto actualizado exitosamente"
      );
      queryClient.invalidateQueries({
        queryKey: catalogKeys.products(businessId),
      });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.product(businessId, variables.productId),
      });
    },
    onError: (error: Error) => {
      toast.error(
        error.message ||
          messages?.errorUpdatingProduct ||
          "Error al actualizar el producto"
      );
    },
  });
}

/**
 * Hook to delete a product
 *
 * @param businessId - The business ID
 * @param messages - Optional translated toast messages. Use useCatalogTranslations() hook to get these
 *
 * @example
 * ```tsx
 * const messages = useCatalogTranslations();
 * const deleteProduct = useDeleteProduct(businessId, messages);
 * ```
 */
export function useDeleteProduct(
  businessId: string,
  messages?: Partial<CatalogToastMessages>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      catalogService.deleteProduct(businessId, productId),
    onSuccess: () => {
      toast.success(
        messages?.productDeleted ?? "Producto eliminado exitosamente"
      );
      queryClient.invalidateQueries({
        queryKey: catalogKeys.products(businessId),
      });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.stats(businessId),
      });
    },
    onError: (error: Error) => {
      toast.error(
        error.message ||
          messages?.errorDeletingProduct ||
          "Error al eliminar el producto"
      );
    },
  });
}

/**
 * Hook to toggle product status
 *
 * @param businessId - The business ID
 * @param messages - Optional translated toast messages. Use useCatalogTranslations() hook to get these
 *
 * @example
 * ```tsx
 * const messages = useCatalogTranslations();
 * const toggleStatus = useToggleProductStatus(businessId, messages);
 * ```
 */
export function useToggleProductStatus(
  businessId: string,
  messages?: Partial<CatalogToastMessages>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      isActive,
    }: {
      productId: string;
      isActive: boolean;
    }) => catalogService.toggleProductStatus(businessId, productId, isActive),
    onSuccess: (_, variables) => {
      toast.success(
        variables.isActive
          ? (messages?.productActivated ?? "Producto activado")
          : (messages?.productDeactivated ?? "Producto desactivado")
      );
      queryClient.invalidateQueries({
        queryKey: catalogKeys.products(businessId),
      });
    },
    onError: (error: Error) => {
      toast.error(
        error.message ||
          messages?.errorChangingStatus ||
          "Error al cambiar el estado"
      );
    },
  });
}

// ============================================================================
// GLOBAL CATALOG HOOKS
// ============================================================================

/**
 * Hook to fetch global catalog (available products)
 */
export function useGlobalCatalog(
  businessId: string,
  filters?: GlobalCatalogFilters,
  options?: UseQueryOptions<PaginatedGlobalCatalog, Error>
) {
  return useQuery({
    queryKey: [...catalogKeys.globalCatalog(businessId), filters],
    queryFn: () => catalogService.getGlobalCatalog(businessId, filters),
    enabled: !!businessId,
    ...options,
  });
}

/**
 * Hook to activate a global product
 *
 * @param businessId - The business ID
 * @param messages - Optional translated toast messages. Use useCatalogTranslations() hook to get these
 *
 * @example
 * ```tsx
 * const messages = useCatalogTranslations();
 * const activateProduct = useActivateGlobalProduct(businessId, messages);
 * ```
 */
export function useActivateGlobalProduct(
  businessId: string,
  messages?: Partial<CatalogToastMessages>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ActivateGlobalProductDto) =>
      catalogService.activateGlobalProduct(businessId, data),
    onSuccess: () => {
      toast.success(
        messages?.productActivatedInCatalog ??
          "Producto activado en tu catálogo"
      );
      // Invalidate both lists
      queryClient.invalidateQueries({
        queryKey: catalogKeys.products(businessId),
      });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.globalCatalog(businessId),
      });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.stats(businessId),
      });
    },
    onError: (error: Error) => {
      toast.error(
        error.message ||
          messages?.errorActivatingProduct ||
          "Error al activar el producto"
      );
    },
  });
}

// ============================================================================
// CATEGORIES HOOKS
// ============================================================================

/**
 * Hook to fetch all categories
 */
export function useCategories(
  businessId: string,
  options?: UseQueryOptions<BusinessCategory[], Error>
) {
  return useQuery({
    queryKey: catalogKeys.categories(businessId),
    queryFn: () => catalogService.getCategories(businessId),
    enabled: !!businessId,
    ...options,
  });
}

/**
 * Hook to fetch a single category
 */
export function useCategory(
  businessId: string,
  categoryId: string,
  options?: UseQueryOptions<BusinessCategory, Error>
) {
  return useQuery({
    queryKey: catalogKeys.category(businessId, categoryId),
    queryFn: () => catalogService.getCategoryById(businessId, categoryId),
    enabled: !!businessId && !!categoryId,
    ...options,
  });
}

/**
 * Hook to fetch all industry categories
 */
export function useIndustryCategories(
  options?: UseQueryOptions<IndustryCategory[], Error>
) {
  return useQuery({
    queryKey: catalogKeys.industryCategories(),
    queryFn: () => catalogService.getIndustryCategories(),
    ...options,
  });
}

/**
 * Hook to create a category
 *
 * @param businessId - The business ID
 * @param messages - Optional translated toast messages. Use useCatalogTranslations() hook to get these
 *
 * @example
 * ```tsx
 * const messages = useCatalogTranslations();
 * const createCategory = useCreateCategory(businessId, messages);
 * ```
 */
export function useCreateCategory(
  businessId: string,
  messages?: Partial<CatalogToastMessages>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryDto) =>
      catalogService.createCategory(businessId, data),
    onSuccess: () => {
      toast.success(
        messages?.categoryCreated ?? "Categoría creada exitosamente"
      );
      queryClient.invalidateQueries({
        queryKey: catalogKeys.categories(businessId),
      });
    },
    onError: (error: Error) => {
      toast.error(
        error.message ||
          messages?.errorCreatingCategory ||
          "Error al crear la categoría"
      );
    },
  });
}

/**
 * Hook to update a category
 *
 * @param businessId - The business ID
 * @param messages - Optional translated toast messages. Use useCatalogTranslations() hook to get these
 *
 * @example
 * ```tsx
 * const messages = useCatalogTranslations();
 * const updateCategory = useUpdateCategory(businessId, messages);
 * ```
 */
export function useUpdateCategory(
  businessId: string,
  messages?: Partial<CatalogToastMessages>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      data,
    }: {
      categoryId: string;
      data: UpdateCategoryDto;
    }) => catalogService.updateCategory(businessId, categoryId, data),
    onSuccess: () => {
      toast.success(
        messages?.categoryUpdated ?? "Categoría actualizada exitosamente"
      );
      queryClient.invalidateQueries({
        queryKey: catalogKeys.categories(businessId),
      });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.products(businessId),
      });
    },
    onError: (error: Error) => {
      toast.error(
        error.message ||
          messages?.errorUpdatingCategory ||
          "Error al actualizar la categoría"
      );
    },
  });
}

/**
 * Hook to delete a category
 *
 * @param businessId - The business ID
 * @param messages - Optional translated toast messages. Use useCatalogTranslations() hook to get these
 *
 * @example
 * ```tsx
 * const messages = useCatalogTranslations();
 * const deleteCategory = useDeleteCategory(businessId, messages);
 * ```
 */
export function useDeleteCategory(
  businessId: string,
  messages?: Partial<CatalogToastMessages>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) =>
      catalogService.deleteCategory(businessId, categoryId),
    onSuccess: () => {
      toast.success(
        messages?.categoryDeleted ?? "Categoría eliminada exitosamente"
      );
      queryClient.invalidateQueries({
        queryKey: catalogKeys.categories(businessId),
      });
    },
    onError: (error: Error) => {
      toast.error(
        error.message ||
          messages?.errorDeletingCategory ||
          "Error al eliminar la categoría"
      );
    },
  });
}

/**
 * Hook to toggle category status
 *
 * @param businessId - The business ID
 * @param messages - Optional translated toast messages. Use useCatalogTranslations() hook to get these
 *
 * @example
 * ```tsx
 * const messages = useCatalogTranslations();
 * const toggleStatus = useToggleCategoryStatus(businessId, messages);
 * ```
 */
export function useToggleCategoryStatus(
  businessId: string,
  messages?: Partial<CatalogToastMessages>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      isActive,
    }: {
      categoryId: string;
      isActive: boolean;
    }) => catalogService.toggleCategoryStatus(businessId, categoryId, isActive),
    onSuccess: (_, variables) => {
      toast.success(
        variables.isActive
          ? (messages?.categoryActivated ?? "Categoría activada")
          : (messages?.categoryDeactivated ?? "Categoría desactivada")
      );
      queryClient.invalidateQueries({
        queryKey: catalogKeys.categories(businessId),
      });
    },
    onError: (error: Error) => {
      toast.error(
        error.message ||
          messages?.errorChangingStatus ||
          "Error al cambiar el estado"
      );
    },
  });
}

// ============================================================================
// STATS HOOKS
// ============================================================================

/**
 * Hook to fetch catalog statistics
 */
export function useCatalogStats(
  businessId: string,
  options?: UseQueryOptions<
    {
      totalProducts: number;
      activeProducts: number;
      inactiveProducts: number;
      fromTemplate: number;
      customProducts: number;
      categoriesCount: number;
    },
    Error
  >
) {
  return useQuery({
    queryKey: catalogKeys.stats(businessId),
    queryFn: () => catalogService.getCatalogStats(businessId),
    enabled: !!businessId,
    ...options,
  });
}

// Re-export the CatalogToastMessages type for convenience

/**
 * Hook to fetch business details by ID
 */
export function useBusiness(
  businessId: string,
  options?: Omit<UseQueryOptions<Business, Error, Business, readonly unknown[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Business, Error, Business, readonly unknown[]>({
    queryKey: catalogKeys.business(businessId),
    queryFn: async () => {
      const { data } = await apiClient.get<Business>(`/businesses/${businessId}`);
      return data;
    },
    enabled: !!businessId,
    ...options,
  });
}

// ============================================================================
// HYBRID INVENTORY HOOKS
// ============================================================================

/**
 * Hook to fetch products with branch filter (HYBRID approach)
 */
export function useProductsWithBranchFilter(
  businessId: string,
  params: {
    branchId?: string;
    activationStatus?: "activated" | "not_activated" | "all";
    search?: string;
    categoryId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  },
  options?: UseQueryOptions<PaginatedProductsWithBranchStatus, Error>
) {
  return useQuery({
    queryKey: [...catalogKeys.products(businessId), "branch-filter", params],
    queryFn: () => catalogService.getProductsWithBranchFilter(businessId, params),
    enabled: !!businessId && !!params.branchId, // Solo ejecutar cuando hay sede seleccionada
    ...options,
  });
}

/**
 * Hook to fetch product with branch availability
 */
export function useProductWithBranchAvailability(
  businessId: string,
  productId: string,
  options?: UseQueryOptions<BusinessProductWithAvailability, Error>
) {
  return useQuery({
    queryKey: [...catalogKeys.product(businessId, productId), "with-availability"],
    queryFn: () => catalogService.getProductWithBranchAvailability(businessId, productId),
    enabled: !!businessId && !!productId,
    ...options,
  });
}

/**
 * Hook for bulk branch update
 */
export function useBulkBranchUpdate(
  businessId: string,
  messages?: Partial<CatalogToastMessages>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkBranchUpdateDto) =>
      catalogService.bulkBranchUpdate(businessId, data),
    onSuccess: (result) => {
      toast.success(
        messages?.bulkUpdateSuccess ??
          `${result.processed} productos actualizados exitosamente`
      );
      queryClient.invalidateQueries({
        queryKey: catalogKeys.products(businessId),
      });
    },
    onError: (error: Error) => {
      toast.error(
        error.message ||
          messages?.errorBulkUpdate ||
          "Error al actualizar productos"
      );
    },
  });
}

export type { CatalogToastMessages } from "./useCatalogTranslations";

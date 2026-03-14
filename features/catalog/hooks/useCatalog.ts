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
} from "../types/catalog.types";
import * as catalogService from "../services/catalog.service";

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
  stats: (businessId: string) =>
    [...catalogKeys.all, "stats", businessId] as const,
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
  options?: UseQueryOptions<BusinessProduct[], Error>
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
 */
export function useCreateProduct(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomProductDto) =>
      catalogService.createCustomProduct(businessId, data),
    onSuccess: () => {
      toast.success("Producto creado exitosamente");
      queryClient.invalidateQueries({
        queryKey: catalogKeys.products(businessId),
      });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.stats(businessId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al crear el producto");
    },
  });
}

/**
 * Hook to update a product
 */
export function useUpdateProduct(businessId: string) {
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
      toast.success("Producto actualizado exitosamente");
      queryClient.invalidateQueries({
        queryKey: catalogKeys.products(businessId),
      });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.product(businessId, variables.productId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar el producto");
    },
  });
}

/**
 * Hook to delete a product
 */
export function useDeleteProduct(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      catalogService.deleteProduct(businessId, productId),
    onSuccess: () => {
      toast.success("Producto eliminado exitosamente");
      queryClient.invalidateQueries({
        queryKey: catalogKeys.products(businessId),
      });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.stats(businessId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al eliminar el producto");
    },
  });
}

/**
 * Hook to toggle product status
 */
export function useToggleProductStatus(businessId: string) {
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
        variables.isActive ? "Producto activado" : "Producto desactivado"
      );
      queryClient.invalidateQueries({
        queryKey: catalogKeys.products(businessId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al cambiar el estado");
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
  options?: UseQueryOptions<GlobalProduct[], Error>
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
 */
export function useActivateGlobalProduct(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ActivateGlobalProductDto) =>
      catalogService.activateGlobalProduct(businessId, data),
    onSuccess: () => {
      toast.success("Producto activado en tu catálogo");
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
      toast.error(error.message || "Error al activar el producto");
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
 * Hook to create a category
 */
export function useCreateCategory(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryDto) =>
      catalogService.createCategory(businessId, data),
    onSuccess: () => {
      toast.success("Categoría creada exitosamente");
      queryClient.invalidateQueries({
        queryKey: catalogKeys.categories(businessId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al crear la categoría");
    },
  });
}

/**
 * Hook to update a category
 */
export function useUpdateCategory(businessId: string) {
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
      toast.success("Categoría actualizada exitosamente");
      queryClient.invalidateQueries({
        queryKey: catalogKeys.categories(businessId),
      });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.products(businessId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar la categoría");
    },
  });
}

/**
 * Hook to delete a category
 */
export function useDeleteCategory(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) =>
      catalogService.deleteCategory(businessId, categoryId),
    onSuccess: () => {
      toast.success("Categoría eliminada exitosamente");
      queryClient.invalidateQueries({
        queryKey: catalogKeys.categories(businessId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al eliminar la categoría");
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

/**
 * Industry Category Hooks
 * 
 * React Query hooks for Super Admin industry category management.
 * 
 * Translation keys are accessed via useTranslations('admin-industry-categories') internally.
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
  IndustryCategory,
  CreateIndustryCategoryDto,
  UpdateIndustryCategoryDto,
  IndustryCategoryFilters,
} from "../types/industry-category.types";
import * as industryCategoryService from "../services/industry-category.service";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const industryCategoryKeys = {
  all: ["industry-categories"] as const,
  lists: () => [...industryCategoryKeys.all, "list"] as const,
  list: (filters: IndustryCategoryFilters | undefined) =>
    [...industryCategoryKeys.lists(), filters] as const,
  details: () => [...industryCategoryKeys.all, "detail"] as const,
  detail: (id: string) => [...industryCategoryKeys.details(), id] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch industry categories with optional filters
 */
export function useIndustryCategories(
  filters?: IndustryCategoryFilters,
  options?: UseQueryOptions<IndustryCategory[], Error>
) {
  return useQuery({
    queryKey: industryCategoryKeys.list(filters),
    queryFn: () => industryCategoryService.getIndustryCategories(filters),
    ...options,
  });
}

/**
 * Hook to fetch a single industry category
 */
export function useIndustryCategory(
  id: string,
  options?: UseQueryOptions<IndustryCategory, Error>
) {
  return useQuery({
    queryKey: industryCategoryKeys.detail(id),
    queryFn: () => industryCategoryService.getIndustryCategory(id),
    enabled: !!id,
    ...options,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to create a new industry category
 */
export function useCreateIndustryCategory() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-industry-categories");

  return useMutation({
    mutationFn: (data: CreateIndustryCategoryDto) =>
      industryCategoryService.createIndustryCategory(data),
    onSuccess: () => {
      toast.success(t("notifications.categoryCreated"));
      queryClient.invalidateQueries({
        queryKey: industryCategoryKeys.lists(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("errors.createCategory"));
    },
  });
}

/**
 * Hook to update an industry category
 */
export function useUpdateIndustryCategory() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-industry-categories");

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIndustryCategoryDto }) =>
      industryCategoryService.updateIndustryCategory(id, data),
    onSuccess: (_, variables) => {
      toast.success(t("notifications.categoryUpdated"));
      queryClient.invalidateQueries({
        queryKey: industryCategoryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: industryCategoryKeys.detail(variables.id),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("errors.updateCategory"));
    },
  });
}

/**
 * Hook to delete an industry category
 */
export function useDeleteIndustryCategory() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-industry-categories");

  return useMutation({
    mutationFn: (id: string) => industryCategoryService.deleteIndustryCategory(id),
    onSuccess: () => {
      toast.success(t("notifications.categoryDeleted"));
      queryClient.invalidateQueries({
        queryKey: industryCategoryKeys.lists(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("errors.deleteCategory"));
    },
  });
}

/**
 * Hook to toggle industry category status (activate/deactivate)
 */
export function useToggleIndustryCategoryStatus() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-industry-categories");

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (isActive) {
        return industryCategoryService.activateIndustryCategory(id);
      }
      return industryCategoryService.deactivateIndustryCategory(id);
    },
    onSuccess: (_, variables) => {
      const message = variables.isActive
        ? t("notifications.categoryActivated")
        : t("notifications.categoryDeactivated");
      toast.success(message);
      queryClient.invalidateQueries({
        queryKey: industryCategoryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: industryCategoryKeys.detail(variables.id),
      });
    },
    onError: (error: Error, variables) => {
      const message = variables.isActive
        ? t("errors.activateCategory")
        : t("errors.deactivateCategory");
      toast.error(error.message || message);
    },
  });
}

"use client";

/**
 * Branch Inventory Hook
 * 
 * React Query hooks for branch inventory management.
 * Includes queries for fetching inventory and mutations for all CRUD operations.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  getBranchInventory,
  activateProduct,
  updateInventory,
  deactivateProduct,
  bulkActivate,
  updateStock,
  setAvailability,
} from "../services/branch-inventory.service";
import { BRANCH_INVENTORY_KEYS, STALE_TIME, GC_TIME } from "./query-keys";
import type {
  InventoryItem,
  CreateInventoryDto,
  UpdateInventoryDto,
  BulkActivateDto,
  BulkActivateResponse,
  InventoryFilters,
  PaginatedInventory,
} from "../types";

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch inventory for a specific branch
 * Uses LEFT JOIN - shows all products with their branch status
 */
export function useBranchInventory(
  businessId: string | null,
  branchId: string | null,
  filters?: InventoryFilters
): UseQueryResult<PaginatedInventory, Error> {
  return useQuery({
    queryKey: [
      ...BRANCH_INVENTORY_KEYS.byBranch(businessId || "", branchId || ""),
      filters,
    ],
    queryFn: () =>
      getBranchInventory(businessId!, branchId!, filters),
    enabled: !!businessId && !!branchId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: (failureCount, error) => {
      if (error instanceof Error) {
        const message = error.message;
        if (message.includes("401") || message.includes("403")) {
          return false;
        }
      }
      return failureCount < 3;
    },
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to activate a product in a branch
 */
export function useActivateProduct(
  businessId: string,
  branchId: string
): UseMutationResult<
  InventoryItem,
  Error,
  { productId: string; data: CreateInventoryDto }
> {
  const queryClient = useQueryClient();
  const t = useTranslations("inventory");

  return useMutation({
    mutationFn: ({ productId, data }) =>
      activateProduct(businessId, branchId, productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: BRANCH_INVENTORY_KEYS.byBranch(businessId, branchId),
      });
      toast.success(t("notifications.activated"));
    },
    onError: (error) => {
      toast.error(t("notifications.activateError", { error: error.message }));
    },
  });
}

/**
 * Hook to update inventory for a product
 */
export function useUpdateInventory(
  businessId: string,
  branchId: string
): UseMutationResult<
  InventoryItem,
  Error,
  { productId: string; data: UpdateInventoryDto }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, data }) =>
      updateInventory(businessId, branchId, productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: BRANCH_INVENTORY_KEYS.byBranch(businessId, branchId),
      });
    },
  });
}

/**
 * Hook to deactivate a product in a branch
 */
export function useDeactivateProduct(
  businessId: string,
  branchId: string
): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  const t = useTranslations("inventory");

  return useMutation({
    mutationFn: (productId: string) =>
      deactivateProduct(businessId, branchId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: BRANCH_INVENTORY_KEYS.byBranch(businessId, branchId),
      });
      toast.success(t("notifications.deactivated"));
    },
    onError: (error) => {
      toast.error(t("notifications.deactivateError", { error: error.message }));
    },
  });
}

/**
 * Hook to bulk activate products
 */
export function useBulkActivate(
  businessId: string,
  branchId: string
): UseMutationResult<BulkActivateResponse, Error, BulkActivateDto> {
  const queryClient = useQueryClient();
  const t = useTranslations("inventory");

  return useMutation({
    mutationFn: (data: BulkActivateDto) =>
      bulkActivate(businessId, branchId, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: BRANCH_INVENTORY_KEYS.byBranch(businessId, branchId),
      });
      toast.success(
        t("notifications.bulkActivated", {
          count: result.created,
          existing: result.existing,
        })
      );
      if (result.errors.length > 0) {
        result.errors.forEach((error) => toast.error(error));
      }
    },
    onError: (error) => {
      toast.error(t("notifications.bulkActivateError", { error: error.message }));
    },
  });
}

/**
 * Hook to update stock (increment/decrement)
 */
export function useUpdateStock(
  businessId: string,
  branchId: string
): UseMutationResult<
  InventoryItem,
  Error,
  { productId: string; quantity: number }
> {
  const queryClient = useQueryClient();
  const t = useTranslations("inventory");

  return useMutation({
    mutationFn: ({ productId, quantity }) =>
      updateStock(businessId, branchId, productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: BRANCH_INVENTORY_KEYS.byBranch(businessId, branchId),
      });
      toast.success(t("notifications.stockUpdated"));
    },
    onError: (error) => {
      toast.error(t("notifications.stockError", { error: error.message }));
    },
  });
}

/**
 * Hook to set product availability
 */
export function useSetAvailability(
  businessId: string,
  branchId: string
): UseMutationResult<
  InventoryItem,
  Error,
  { productId: string; isAvailable: boolean }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, isAvailable }) =>
      setAvailability(businessId, branchId, productId, isAvailable),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: BRANCH_INVENTORY_KEYS.byBranch(businessId, branchId),
      });
    },
  });
}

// ============================================================================
// DEBOUNCED UPDATE HOOK
// ============================================================================

interface DebouncedUpdateState {
  [productId: string]: {
    stock?: number;
    priceOverride?: number;
    timeoutId?: NodeJS.Timeout;
  };
}

/**
 * Hook for debounced inventory updates (auto-save)
 * Returns a function to queue updates with 500ms debounce
 */
export function useDebouncedInventoryUpdate(
  businessId: string,
  branchId: string,
  onSuccess?: () => void
): {
  queueUpdate: (
    productId: string,
    field: "stock" | "priceOverride",
    value: number
  ) => void;
} {
  const updateMutation = useUpdateInventory(businessId, branchId);
  const pendingUpdates = React.useRef<DebouncedUpdateState>({});

  const queueUpdate = useCallback(
    (productId: string, field: "stock" | "priceOverride", value: number) => {
      // Clear existing timeout for this product/field
      const existing = pendingUpdates.current[productId];
      if (existing?.timeoutId) {
        clearTimeout(existing.timeoutId);
      }

      // Store the new value
      pendingUpdates.current[productId] = {
        ...existing,
        [field]: value,
        timeoutId: setTimeout(() => {
          const updates = pendingUpdates.current[productId];
          if (updates) {
            const dto: UpdateInventoryDto = {};
            if (updates.stock !== undefined) dto.stock = updates.stock;
            if (updates.priceOverride !== undefined)
              dto.priceOverride = updates.priceOverride;

            updateMutation.mutate(
              { productId, data: dto },
              {
                onSuccess: () => {
                  onSuccess?.();
                  delete pendingUpdates.current[productId];
                },
              }
            );
          }
        }, 500),
      };
    },
    [updateMutation, onSuccess]
  );

  return { queueUpdate };
}

// React import for the debounced hook
import React from "react";

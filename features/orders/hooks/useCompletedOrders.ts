/**
 * Completed Orders Infinite Scroll Hook
 *
 * Hook for fetching completed orders with infinite scroll pagination.
 * Uses React Query's useInfiniteQuery for efficient data loading.
 */

import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { ORDERS_KEYS } from "../types/order-cache.types";
import type { CompletedOrdersFilters } from "../types/order-cache.types";
import { getCompletedOrders } from "../services/order.service";
import type { Order } from "../types";

// Default page size for infinite scroll
const DEFAULT_PAGE_SIZE = 20;

// Stale times configurables
const STALE_TIME = 30 * 1000; // 30 seconds
const GC_TIME = 5 * 60 * 1000; // 5 minutes

interface UseCompletedOrdersInfiniteResult {
  orders: Order[];
  total: number;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  error: Error | null;
}

/**
 * Hook for fetching completed orders with infinite scroll
 *
 * @param filters - Filters including businessId, search, date range, and branchIds
 * @returns Infinite scroll data and fetch controls
 */
export function useCompletedOrdersInfinite(
  filters: CompletedOrdersFilters
): UseCompletedOrdersInfiniteResult {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const hasBusinessId = !!user?.businessId;
  const hasSelectedBusiness = filters.businessId !== undefined;
  const isEnabled = isSuperAdmin ? hasSelectedBusiness : hasBusinessId;

  // Determine effective businessId
  const effectiveBusinessId =
    filters.businessId ?? user?.businessId ?? undefined;

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, error } =
    useInfiniteQuery({
      queryKey: ORDERS_KEYS.completed(filters.businessId, filters),
      queryFn: async ({ pageParam = 1 }) => {
        if (!effectiveBusinessId) {
          throw new Error("Se requiere un businessId para consultar órdenes");
        }
        return getCompletedOrders({
          ...filters,
          businessId: effectiveBusinessId,
          page: pageParam,
          limit: DEFAULT_PAGE_SIZE,
        });
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.page + 1 : undefined,
      staleTime: STALE_TIME,
      gcTime: GC_TIME,
      enabled: isEnabled,
    });

  // Flatten all pages into a single array of orders
  const allOrders = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.orders);
  }, [data?.pages]);

  // Get total from first page
  const total = useMemo(() => {
    return data?.pages[0]?.total || 0;
  }, [data?.pages]);

  // Wrapper for fetchNextPage with error handling
  const handleFetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    orders: allOrders,
    total,
    isLoading,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage: handleFetchNextPage,
    error: error as Error | null,
  };
}

/**
 * Hook for getting the infinite scroll query state for completed orders
 * Useful when you need access to the raw infinite query data
 */
export function useCompletedOrdersInfiniteRaw(filters: CompletedOrdersFilters) {
  const user = useAuthStore((state) => state.user);
  const effectiveBusinessId =
    filters.businessId ?? user?.businessId ?? undefined;

  return useInfiniteQuery({
    queryKey: ORDERS_KEYS.completed(filters.businessId, filters),
    queryFn: async ({ pageParam = 1 }) => {
      if (!effectiveBusinessId) {
        throw new Error("Se requiere un businessId para consultar órdenes");
      }
      return getCompletedOrders({
        ...filters,
        businessId: effectiveBusinessId,
        page: pageParam,
        limit: DEFAULT_PAGE_SIZE,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: !!effectiveBusinessId,
    select: (data) => ({
      ...data,
      allOrders: data.pages.flatMap((page) => page.orders),
      total: data.pages[0]?.total || 0,
    }),
  });
}

/**
 * Customers Hook
 *
 * Hook para obtener la lista paginada de clientes.
 * Integra filtros de fecha globales automáticamente.
 */

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useBusinessStore } from "@/features/business/stores/business.store";
import { useDateFilterParams } from "@/features/filters/hooks/useDateFilterQuery";
import { getCustomers } from "../services/customer.service";
import type { GetCustomersParams, PaginatedCustomersResponse } from "../types";

// Query keys para mantener consistencia
export const CUSTOMERS_KEYS = {
  all: ["customers"] as const,
  lists: () => [...CUSTOMERS_KEYS.all, "list"] as const,
  list: (filters: GetCustomersParams & { businessId?: string }) =>
    [...CUSTOMERS_KEYS.lists(), JSON.stringify(filters)] as const,
  details: () => [...CUSTOMERS_KEYS.all, "detail"] as const,
  detail: (id: string) => [...CUSTOMERS_KEYS.details(), id] as const,
  metrics: (id: string) => [...CUSTOMERS_KEYS.detail(id), "metrics"] as const,
  orders: (id: string) => [...CUSTOMERS_KEYS.detail(id), "orders"] as const,
  globalMetrics: (filters?: { businessId?: string; branchId?: string; from?: string; to?: string }) => 
    [...CUSTOMERS_KEYS.all, "global-metrics", JSON.stringify(filters ?? {})] as const,
};

// Stale times configurables
export const STALE_TIME = 30 * 1000; // 30 seconds
export const GC_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Hook para obtener la lista paginada de clientes
 *
 * Usa automáticamente los filtros de fecha globales del store.
 * Los parámetros en `params` sobreescriben los filtros globales.
 *
 * @param params - Filtros, paginación y ordenamiento
 */
export function useCustomers(
  params?: GetCustomersParams & { businessId?: string }
) {
  const dateParams = useDateFilterParams();
  const { user } = useAuthStore.getState();
  const { selectedBusinessId } = useBusinessStore();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const hasBusinessId = !!user?.businessId;
  const hasSelectedBusiness = params?.businessId !== undefined || !!selectedBusinessId;
  const isEnabled = isSuperAdmin ? hasSelectedBusiness : hasBusinessId;

  // Determinar el businessId efectivo
  const effectiveBusinessId = params?.businessId || selectedBusinessId || undefined;

  // Merge de parámetros: filtros globales tienen prioridad base
  const mergedParams = {
    ...dateParams,
    page: 1,
    limit: 10,
    ...params,
    businessId: effectiveBusinessId,
    branchId: params?.branchId,
  };

  const query = useQuery<PaginatedCustomersResponse, Error>({
    queryKey: CUSTOMERS_KEYS.list(mergedParams),
    queryFn: () => getCustomers(mergedParams),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: isEnabled,
    retry: (failureCount, error) => {
      // No reintentar en errores 401 o 403
      if (error instanceof Error) {
        const message = error.message;
        if (message.includes("401") || message.includes("403")) {
          return false;
        }
      }
      return failureCount < 3;
    },
  });

  // Helpers de paginación
  const pagination = {
    page: query.data?.meta.page ?? 1,
    limit: query.data?.meta.limit ?? 10,
    total: query.data?.meta.total ?? 0,
    totalPages: query.data?.meta.totalPages ?? 1,
    hasNextPage: (query.data?.meta.page ?? 1) < (query.data?.meta.totalPages ?? 1),
    hasPreviousPage: (query.data?.meta.page ?? 1) > 1,
  };

  return {
    ...query,
    data: query.data?.data ?? [],
    meta: query.data?.meta,
    pagination,
  };
}

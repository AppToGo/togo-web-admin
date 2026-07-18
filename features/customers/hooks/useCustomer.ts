/**
 * Customer Detail Hooks
 *
 * Hooks para obtener detalles de un cliente específico:
 * - Información básica
 * - Métricas (lazy loading)
 * - Historial de pedidos (lazy loading)
 */

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useBusinessStore } from "@/features/business/stores/business.store";
import {
  getCustomerById,
  getCustomerMetrics,
  getCustomerOrders,
} from "../services/customer.service";
import { CUSTOMERS_KEYS } from "./useCustomers";

const STALE_TIME = 30 * 1000;
const GC_TIME = 5 * 60 * 1000;

/**
 * Hook para obtener un cliente específico por ID
 *
 * @param id - ID del cliente
 * @param enabled - Si la query está habilitada (default: true)
 */
export function useCustomer(id: string | null, enabled: boolean = true) {
  const { selectedBusinessId } = useBusinessStore();
  const { user } = useAuthStore.getState();

  // Determinar el businessId efectivo
  const effectiveBusinessId =
    selectedBusinessId || user?.businessId || undefined;

  return useQuery({
    queryKey: [...CUSTOMERS_KEYS.detail(id || ""), effectiveBusinessId],
    queryFn: () => getCustomerById(id!, effectiveBusinessId),
    enabled: !!id && enabled,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Hook para obtener las métricas de un cliente
 * Carga lazy - solo se ejecuta cuando se solicita explícitamente
 *
 * @param id - ID del cliente
 * @param enabled - Si la query está habilitada (default: false para lazy loading)
 */
export function useCustomerMetrics(
  id: string | null,
  enabled: boolean = false
) {
  const { selectedBusinessId } = useBusinessStore();
  const { user } = useAuthStore.getState();

  const effectiveBusinessId =
    selectedBusinessId || user?.businessId || undefined;

  return useQuery({
    queryKey: [...CUSTOMERS_KEYS.metrics(id || ""), effectiveBusinessId],
    queryFn: () => getCustomerMetrics(id!, effectiveBusinessId),
    enabled: !!id && enabled,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Hook para obtener el historial de pedidos de un cliente
 *
 * @param id - ID del cliente
 * @param page - Página actual (default: 1)
 * @param limit - Items por página (default: 10)
 * @param enabled - Si la query está habilitada (default: false para lazy loading)
 */
export function useCustomerOrders(
  id: string | null,
  page: number = 1,
  limit: number = 10,
  enabled: boolean = false
) {
  const { selectedBusinessId } = useBusinessStore();
  const { user } = useAuthStore.getState();

  const effectiveBusinessId =
    selectedBusinessId || user?.businessId || undefined;

  const query = useQuery({
    queryKey: [
      ...CUSTOMERS_KEYS.orders(id || ""),
      effectiveBusinessId,
      page,
      limit,
    ],
    queryFn: () => getCustomerOrders(id!, page, limit, effectiveBusinessId),
    enabled: !!id && enabled,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });

  return {
    ...query,
    data: query.data?.orders ?? [],
    meta: {
      limit: query.data?.limit,
      page: query.data?.page,
      total: query.data?.total,
      totalPages: query.data?.totalPages,
    },
  };
}

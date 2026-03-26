/**
 * Global Customer Metrics Hook
 *
 * Hook para obtener métricas globales de clientes del negocio.
 * Incluye top 10 por frecuencia y top 10 por gasto.
 */

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useBusinessStore } from "@/features/business/stores/business.store";
import { useDateFilterParams } from "@/features/filters/hooks/useDateFilterQuery";
import { getGlobalCustomerMetrics } from "../services/customer.service";
import { CUSTOMERS_KEYS, STALE_TIME, GC_TIME } from "./useCustomers";

/**
 * Hook para obtener métricas globales de clientes
 *
 * Usa automáticamente los filtros de fecha globales del store.
 * SUPER_ADMIN puede pasar businessId para ver métricas de cualquier negocio.
 *
 * @param businessId - ID del negocio (opcional, para SUPER_ADMIN)
 */
export function useGlobalCustomerMetrics(businessId?: string) {
  const dateParams = useDateFilterParams();
  const { user } = useAuthStore.getState();
  const { selectedBusinessId } = useBusinessStore();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const hasBusinessId = !!user?.businessId;
  const hasSelectedBusiness = !!businessId || !!selectedBusinessId;
  const isEnabled = isSuperAdmin ? hasSelectedBusiness : hasBusinessId;

  // Determinar el businessId efectivo
  const effectiveBusinessId = businessId || selectedBusinessId || undefined;

  return useQuery({
    queryKey: [
      ...CUSTOMERS_KEYS.globalMetrics(),
      effectiveBusinessId,
      dateParams.dateFrom,
      dateParams.dateTo,
    ],
    queryFn: () =>
      getGlobalCustomerMetrics(
        effectiveBusinessId,
        dateParams.dateFrom,
        dateParams.dateTo
      ),
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
}

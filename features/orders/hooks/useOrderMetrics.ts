/**
 * Order Metrics Hooks
 *
 * Hooks con TanStack Query para manejar las métricas de órdenes.
 * - Caching optimizado
 * - Revalidación automática
 * - Datos procesados para el dashboard
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useBusinessStore } from "@/features/business/stores/business.store";
import { useBranchStore } from "@/stores/branch.store";
import { useDateFilterParams } from "@/features/filters/hooks/useDateFilterQuery";
import { getOrderMetrics } from "../services/order.service";
import type {
  GetOrderMetricsParams,
  OrderMetricsResponse,
  DashboardMetricsData,
} from "../types/order-metrics.types";

// Query keys para mantener consistencia
export const METRICS_KEYS = {
  all: ["order-metrics"] as const,
  // Usado para invalidar todas las métricas de un negocio (independiente de params)
  business: (businessId: string | undefined) =>
    [...METRICS_KEYS.all, businessId] as const,
  detail: (businessId: string | undefined, params: GetOrderMetricsParams | undefined) =>
    [...METRICS_KEYS.business(businessId), params] as const,
};

// Stale time configurables
const METRICS_STALE_TIME = 60 * 1000; // 60 segundos
const METRICS_GC_TIME = 5 * 60 * 1000; // 5 minutos

/**
 * Hook para obtener métricas de órdenes del backend
 *
 * Usa automáticamente los filtros de fecha globales del store.
 * Opcionalmente se pueden sobreescribir los parámetros.
 *
 * @param params - Parámetros opcionales (businessId, dateFrom, dateTo)
 * @returns Query result con las métricas completas del endpoint
 */
export function useOrderMetrics(params?: GetOrderMetricsParams) {
  const { selectedBusinessId } = useBusinessStore();
  const { selectedBranchIds } = useBranchStore();
  const { user } = useAuthStore();
  const dateParams = useDateFilterParams();

  const effectiveBusinessId =
    params?.businessId || selectedBusinessId || user?.businessId || undefined;

  // Merge de parámetros: incluye branchIds seleccionados
  const mergedParams: GetOrderMetricsParams = {
    ...dateParams,
    branchIds: selectedBranchIds.length > 0 ? selectedBranchIds : undefined,
    ...params,
  };

  return useQuery({
    queryKey: METRICS_KEYS.detail(effectiveBusinessId, mergedParams),
    queryFn: () =>
      getOrderMetrics({ ...mergedParams, businessId: effectiveBusinessId }),
    staleTime: METRICS_STALE_TIME,
    gcTime: METRICS_GC_TIME,
    enabled: !!effectiveBusinessId,
  });
}

/**
 * Hook para obtener datos procesados del dashboard
 *
 * Transforma los datos crudos del endpoint en un formato más
 * amigable para usar en componentes de dashboard.
 *
 * Usa automáticamente los filtros de fecha globales del store.
 *
 * @param params - Parámetros opcionales (businessId)
 * @returns Datos procesados para el dashboard y métricas crudas
 */
export function useDashboardMetrics(params?: Omit<GetOrderMetricsParams, 'dateFrom' | 'dateTo'>) {
  const { selectedBranchIds } = useBranchStore();
  const { data: metrics, ...rest } = useOrderMetrics({
    ...params,
    branchIds: params?.branchIds ?? (selectedBranchIds.length > 0 ? selectedBranchIds : undefined),
  });

  const dashboardData: DashboardMetricsData | null = useMemo(() => {
    if (!metrics) return null;

    return {
      ordersToday: metrics.conteos.hoy,
      ordersCompletedToday: metrics.conteos.completadasHoy,
      revenueToday: metrics.recaudos.pagadas.total,
      revenueGrowth: metrics.comparativa.recaudoTotal.crecimiento,
      ordersGrowth: metrics.comparativa.ordenesTotales.crecimiento,
      totalOrders: metrics.conteos.total,
      paidOrders: metrics.conteos.pagadas,
      pendingOrders: metrics.conteos.pendientesPago,
    };
  }, [metrics]);

  return { data: dashboardData, raw: metrics, ...rest };
}

/**
 * Hook para obtener métricas detalladas con todos los datos del endpoint
 *
 * Útil para páginas de análisis detallado donde se necesita
 * acceso a todos los campos de la respuesta.
 *
 * @param params - Parámetros opcionales (businessId, dateFrom, dateTo)
 * @returns Métricas completas con helpers adicionales
 */
export function useDetailedMetrics(params?: GetOrderMetricsParams) {
  const { data: metrics, ...rest } = useOrderMetrics(params);

  const helpers = useMemo(() => {
    if (!metrics) return null;

    return {
      // Total de órdenes por tipo de entrega
      deliveryOrders: metrics.porTipoEntrega.DELIVERY.total,
      pickupOrders: metrics.porTipoEntrega.PICKUP.total,
      dineInOrders: metrics.porTipoEntrega.DINE_IN.total,

      // Recaudos por tipo de entrega
      deliveryRevenue: metrics.recaudos.delivery.pagadas.total,
      pickupRevenue: metrics.recaudos.pickup.pagadas.total,
      dineInRevenue: metrics.recaudos.dineIn.pagadas.total,

      // Porcentajes de conversión
      conversionRates: metrics.tasasConversion,

      // Método de pago más usado
      topPaymentMethod:
        metrics.metodosPago.length > 0 ? metrics.metodosPago[0] : null,

      // Hora pico
      peakHour:
        metrics.horasPico.length > 0
          ? metrics.horasPico.reduce((max, h) =>
              h.cantidad > max.cantidad ? h : max
            )
          : null,
    };
  }, [metrics]);

  return { data: metrics, helpers, ...rest };
}

// Re-exportar tipos útiles
export type { OrderMetricsResponse, DashboardMetricsData };

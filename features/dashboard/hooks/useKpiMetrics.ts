'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth/stores/auth.store';
import { useDateFilterRange } from '@/features/filters/stores/date-filter.store';
import { useDashboardBranchId } from '../stores/branch-filter.store';
import apiClient from '@/services/api.service';
import { KpiMetrics } from '../types/dashboard.types';

const KPI_STALE_TIME = 30 * 1000; // 30 seconds
const KPI_GC_TIME = 2 * 60 * 1000; // 2 minutes

export interface UseKpiMetricsOptions {
  enabled?: boolean;
  branchId?: string | null;
}

interface KpiMetricsResponse {
  conteos: {
    hoy: number;
    completadasHoy: number;
    total: number;
    pagadas: number;
    pendientesPago: number;
  };
  recaudos: {
    pagadas: {
      total: number;
    };
  };
  comparativa: {
    recaudoTotal: {
      crecimiento: number;
    };
    ordenesTotales: {
      crecimiento: number;
    };
  };
}

async function fetchKpiMetrics(
  businessId: string,
  dateFrom: string,
  dateTo: string,
  branchId?: string | null
): Promise<KpiMetrics> {
  const params: Record<string, string> = {
    dateFrom,
    dateTo,
  };
  
  if (branchId) {
    params.branchIds = branchId;
  }
  
  const { data } = await apiClient.get<KpiMetricsResponse>(
    `/businesses/${businessId}/orders/metrics`,
    {
      params,
    }
  );

  // Transformar respuesta del backend al formato KpiMetrics
  return {
    ordersToday: data.conteos.hoy,
    ordersCompletedToday: data.conteos.completadasHoy,
    revenueToday: data.recaudos.pagadas.total,
    revenueGrowth: data.comparativa.recaudoTotal.crecimiento,
    ordersGrowth: data.comparativa.ordenesTotales.crecimiento,
    totalOrders: data.conteos.total,
    paidOrders: data.conteos.pagadas,
    pendingOrders: data.conteos.pendientesPago,
  };
}

export function useKpiMetrics(options?: UseKpiMetricsOptions) {
  const user = useCurrentUser();
  const businessId = user?.businessId;
  const dateRange = useDateFilterRange();
  const dashboardBranchId = useDashboardBranchId();
  
  // Usar branchId de las opciones si se proporciona, sino usar el del store
  const branchId = options?.branchId !== undefined ? options.branchId : dashboardBranchId;

  return useQuery({
    queryKey: ['dashboard', 'kpi', businessId, dateRange.from, dateRange.to, branchId],
    queryFn: () => fetchKpiMetrics(businessId!, dateRange.from, dateRange.to, branchId),
    enabled: options?.enabled !== false && !!businessId,
    staleTime: KPI_STALE_TIME,
    gcTime: KPI_GC_TIME,
  });
}

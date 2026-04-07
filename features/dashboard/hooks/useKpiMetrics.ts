'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth/stores/auth.store';
import { useDateFilterRange } from '@/features/filters/stores/date-filter.store';
import apiClient from '@/services/api.service';
import { KpiMetrics } from '../types/dashboard.types';

const KPI_STALE_TIME = 30 * 1000; // 30 seconds
const KPI_GC_TIME = 2 * 60 * 1000; // 2 minutes

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
  dateTo: string
): Promise<KpiMetrics> {
  const { data } = await apiClient.get<KpiMetricsResponse>(
    `/businesses/${businessId}/orders/metrics`,
    {
      params: {
        dateFrom,
        dateTo,
      },
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

export function useKpiMetrics(options?: { enabled?: boolean }) {
  const user = useCurrentUser();
  const businessId = user?.businessId;
  const dateRange = useDateFilterRange();

  return useQuery({
    queryKey: ['dashboard', 'kpi', businessId, dateRange.from, dateRange.to],
    queryFn: () => fetchKpiMetrics(businessId!, dateRange.from, dateRange.to),
    enabled: options?.enabled !== false && !!businessId,
    staleTime: KPI_STALE_TIME,
    gcTime: KPI_GC_TIME,
  });
}

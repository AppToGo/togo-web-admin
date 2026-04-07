'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth/stores/auth.store';
import { useDateFilterRange } from '@/features/filters/stores/date-filter.store';
import { useDashboardBranchId } from '../stores/branch-filter.store';
import apiClient from '@/services/api.service';
import { DetailedMetrics } from '../types/dashboard.types';

const DETAILED_STALE_TIME = 2 * 60 * 1000; // 2 minutes
const DETAILED_GC_TIME = 5 * 60 * 1000; // 5 minutes

export interface UseDetailedMetricsOptions {
  enabled?: boolean;
  branchId?: string | null;
}

interface DetailedMetricsResponse {
  metodosPago: Array<{
    metodo: string;
    cantidad: number;
    monto: number;
    porcentaje: number;
  }>;
  comparativa: {
    recaudoTotal: {
      valor: number;
      valorAnterior: number;
      crecimiento: number;
    };
  };
  tasasConversion: {
    conteos: {
      confirmado: number;
      pagado: number;
      completado: number;
    };
    confirmacion: number;
    pago: number;
    completitud: number;
    cancelacion: number;
    abandono: number;
  };
  recaudos: {
    porDia?: Array<{
      date: string;
      amount: number;
    }>;
  };
  horasPico: Array<{
    hora: number;
    cantidad: number;
  }>;
}

async function fetchDetailedMetrics(
  businessId: string,
  dateFrom: string,
  dateTo: string,
  branchId?: string | null
): Promise<DetailedMetrics> {
  const params: Record<string, string> = {
    dateFrom,
    dateTo,
  };
  
  if (branchId) {
    params.branchIds = branchId;
  }
  
  const { data } = await apiClient.get<DetailedMetricsResponse>(
    `/businesses/${businessId}/orders/metrics`,
    {
      params,
    }
  );

  // Debug: Verificar respuesta de la API
  console.log('API Response:', data);
  console.log('metodosPago:', data.metodosPago);
  console.log('metodosPago length:', data.metodosPago?.length);
  console.log('porDia:', data.recaudos?.porDia);
  console.log('porDia length:', data.recaudos?.porDia?.length);

  return {
    paymentMethods: (data.metodosPago || []).map((m: DetailedMetricsResponse['metodosPago'][0]) => ({
      method: m.metodo,
      count: m.cantidad,
      amount: m.monto,
      percentage: m.porcentaje,
    })),
    trendComparison: {
      current: data.comparativa.recaudoTotal.valor,
      previous: data.comparativa.recaudoTotal.valorAnterior,
      growth: data.comparativa.recaudoTotal.crecimiento,
    },
    conversionFunnel: {
      // Usar conteos desde tasasConversion.conteos (estructura correcta del backend)
      confirmed: data.tasasConversion.conteos.confirmado,
      paid: data.tasasConversion.conteos.pagado,
      completed: data.tasasConversion.conteos.completado,
      rates: {
        confirmedToPaid: data.tasasConversion.pago,
        paidToCompleted: data.tasasConversion.completitud,
      },
    },
    revenueChart: data.recaudos.porDia || [],
    peakHours: data.horasPico.map((h: DetailedMetricsResponse['horasPico'][0]) => ({
      hour: h.hora,
      count: h.cantidad,
    })),
  };
}

export function useDetailedMetrics(options?: UseDetailedMetricsOptions) {
  const user = useCurrentUser();
  const businessId = user?.businessId;
  const dateRange = useDateFilterRange();
  const dashboardBranchId = useDashboardBranchId();
  
  // Usar branchId de las opciones si se proporciona, sino usar el del store
  const branchId = options?.branchId !== undefined ? options.branchId : dashboardBranchId;

  return useQuery({
    queryKey: ['dashboard', 'detailed', businessId, dateRange.from, dateRange.to, branchId],
    queryFn: () => fetchDetailedMetrics(businessId!, dateRange.from, dateRange.to, branchId),
    enabled: options?.enabled !== false && !!businessId,
    staleTime: DETAILED_STALE_TIME,
    gcTime: DETAILED_GC_TIME,
  });
}

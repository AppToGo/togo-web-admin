'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth/stores/auth.store';
import { useDateFilterRange } from '@/features/filters/stores/date-filter.store';
import apiClient from '@/services/api.service';
import { DetailedMetrics } from '../types/dashboard.types';

const DETAILED_STALE_TIME = 2 * 60 * 1000; // 2 minutes
const DETAILED_GC_TIME = 5 * 60 * 1000; // 5 minutes

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
  dateTo: string
): Promise<DetailedMetrics> {
  const { data } = await apiClient.get<DetailedMetricsResponse>(
    `/businesses/${businessId}/orders/metrics`,
    {
      params: {
        dateFrom,
        dateTo,
      },
    }
  );

  return {
    paymentMethods: data.metodosPago.map((m: DetailedMetricsResponse['metodosPago'][0]) => ({
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

export function useDetailedMetrics(options?: { enabled?: boolean }) {
  const user = useCurrentUser();
  const businessId = user?.businessId;
  const dateRange = useDateFilterRange();

  return useQuery({
    queryKey: ['dashboard', 'detailed', businessId, dateRange.from, dateRange.to],
    queryFn: () => fetchDetailedMetrics(businessId!, dateRange.from, dateRange.to),
    enabled: options?.enabled !== false && !!businessId,
    staleTime: DETAILED_STALE_TIME,
    gcTime: DETAILED_GC_TIME,
  });
}

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
  conteos: {
    pagadas: number;
  };
  /** Pedidos del período según su estado ACTUAL. */
  porEstadoOrden?: Partial<Record<string, number>>;
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

  // Mapear métodos de pago
  const paymentMethods = (data.metodosPago || []).map((m: DetailedMetricsResponse['metodosPago'][0]) => ({
    method: m.metodo,
    count: m.cantidad,
    amount: m.monto,
    // La API manda cantidad/total×100 sin redondear (p. ej. 58.33…).
    percentage: Math.round(m.porcentaje),
  }));

  return {
    paymentMethods,
    trendComparison: {
      current: data.comparativa.recaudoTotal.valor,
      previous: data.comparativa.recaudoTotal.valorAnterior,
      growth: data.comparativa.recaudoTotal.crecimiento,
    },
    conversionFunnel: toConversionFunnel(data),
    revenueChart: data.recaudos.porDia || [],
    peakHours: data.horasPico.map((h: DetailedMetricsResponse['horasPico'][0]) => ({
      hour: h.hora,
      count: h.cantidad,
    })),
  };
}

// Estados en los que el pedido nunca llegó a confirmarse.
const NOT_CONFIRMED_STATUSES = new Set(['DRAFT', 'ABANDONED']);

/**
 * Embudo acumulado del período. `tasasConversion.conteos` de la API cuenta
 * los pedidos por su estado ACTUAL (cuántos siguen en CONFIRMED o en PAID), y
 * los pedidos pasan de largo esos estados: un pedido pagado y entregado queda
 * en COMPLETED, así que "pagadas" daba 0. Acá cada etapa cuenta a todos los
 * que llegaron a ella:
 * - confirmadas: todo pedido que salió de borrador (incluye cancelados).
 * - pagadas: `paymentStatus = PAID` (`conteos.pagadas`), sin importar el estado.
 * - completadas: estado COMPLETED.
 */
function toConversionFunnel(
  data: DetailedMetricsResponse
): DetailedMetrics['conversionFunnel'] {
  const byStatus = data.porEstadoOrden ?? {};
  const confirmed = Object.entries(byStatus).reduce(
    (sum, [status, count]) =>
      NOT_CONFIRMED_STATUSES.has(status) ? sum : sum + (count ?? 0),
    0
  );

  return {
    confirmed,
    paid: data.conteos.pagadas,
    completed: byStatus.COMPLETED ?? 0,
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

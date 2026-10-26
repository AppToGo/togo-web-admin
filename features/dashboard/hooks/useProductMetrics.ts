'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth/stores/auth.store';
import { useDateFilterRange } from '@/features/filters/stores/date-filter.store';
import { useDashboardBranchId } from '../stores/branch-filter.store';
import apiClient from '@/services/api.service';
import type {
  ProductMetrics,
  ProductSales,
  ProductTrend,
} from '../types/dashboard.types';

const PRODUCTS_STALE_TIME = 2 * 60 * 1000; // 2 minutes
const PRODUCTS_GC_TIME = 5 * 60 * 1000; // 5 minutes

interface SalesRowResponse {
  productId: string | null;
  name: string;
  orderCount: number;
  totalQuantity: number;
  totalSpent: number;
  share: number;
}

interface TrendRowResponse extends SalesRowResponse {
  previousQuantity: number;
  change: number;
  changePct: number | null;
}

interface ProductMetricsResponse {
  masVendidos: {
    porUnidades: SalesRowResponse[];
    porIngresos: SalesRowResponse[];
  };
  sinVentas: { total: number; productos: ProductMetrics['withoutSales']['products'] };
  tendencias: { enAlza: TrendRowResponse[]; enBaja: TrendRowResponse[] };
}

const toSales = (r: SalesRowResponse): ProductSales => ({
  productId: r.productId,
  name: r.name,
  orderCount: r.orderCount,
  quantity: r.totalQuantity,
  revenue: r.totalSpent,
  share: r.share,
});

const toTrend = (r: TrendRowResponse): ProductTrend => ({
  ...toSales(r),
  previousQuantity: r.previousQuantity,
  change: r.change,
  changePct: r.changePct,
});

async function fetchProductMetrics(
  businessId: string,
  dateFrom: string,
  dateTo: string,
  branchId?: string | null
): Promise<ProductMetrics> {
  const params: Record<string, string> = { dateFrom, dateTo };
  if (branchId) {
    params.branchIds = branchId;
  }

  const { data } = await apiClient.get<ProductMetricsResponse>(
    `/businesses/${businessId}/metrics/products`,
    { params }
  );

  return {
    topByQuantity: data.masVendidos.porUnidades.map(toSales),
    topByRevenue: data.masVendidos.porIngresos.map(toSales),
    withoutSales: {
      total: data.sinVentas.total,
      products: data.sinVentas.productos,
    },
    trends: {
      rising: data.tendencias.enAlza.map(toTrend),
      falling: data.tendencias.enBaja.map(toTrend),
    },
  };
}

export interface UseProductMetricsOptions {
  enabled?: boolean;
  branchId?: string | null;
}

/** Estadísticas de productos con el período y la sede del dashboard. */
export function useProductMetrics(options?: UseProductMetricsOptions) {
  const businessId = useCurrentUser()?.businessId;
  const dateRange = useDateFilterRange();
  const dashboardBranchId = useDashboardBranchId();

  // Usar branchId de las opciones si se proporciona, sino usar el del store
  const branchId = options?.branchId !== undefined ? options.branchId : dashboardBranchId;

  return useQuery({
    queryKey: ['dashboard', 'products', businessId, dateRange.from, dateRange.to, branchId],
    queryFn: () => fetchProductMetrics(businessId!, dateRange.from, dateRange.to, branchId),
    enabled: options?.enabled !== false && !!businessId,
    staleTime: PRODUCTS_STALE_TIME,
    gcTime: PRODUCTS_GC_TIME,
  });
}

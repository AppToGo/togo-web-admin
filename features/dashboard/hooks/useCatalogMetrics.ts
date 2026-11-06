'use client';

import { useQuery } from '@tanstack/react-query';
import { useDateFilterRange } from '@/features/filters/stores/date-filter.store';
import {
  useDashboardBranchId,
  useDashboardBusinessId,
} from '../stores/branch-filter.store';
import apiClient from '@/services/api.service';
import type {
  CatalogFunnelStage,
  CatalogMetrics,
  CatalogProductMetric,
  CatalogSearchMetric,
} from '../types/dashboard.types';

const CATALOG_STALE_TIME = 2 * 60 * 1000; // 2 minutes
const CATALOG_GC_TIME = 5 * 60 * 1000; // 5 minutes

interface CatalogMetricsResponse {
  embudo: { total: CatalogFunnelStage; porOrigen: CatalogFunnelStage[] };
  productos: {
    masVistos: CatalogProductMetric[];
    vistosPocoPedidos: CatalogProductMetric[];
  };
  busquedas: {
    masBuscadas: CatalogSearchMetric[];
    sinResultados: CatalogSearchMetric[];
  };
  porHora: CatalogMetrics['byHour'];
  categorias: CatalogMetrics['categories'];
  destacados: CatalogMetrics['featured'];
  recomendados: CatalogMetrics['recommended'];
}

async function fetchCatalogMetrics(
  businessId: string,
  dateFrom: string,
  dateTo: string,
  branchId?: string | null
): Promise<CatalogMetrics> {
  const params: Record<string, string> = { dateFrom, dateTo };
  if (branchId) {
    params.branchIds = branchId;
  }

  const { data } = await apiClient.get<CatalogMetricsResponse>(
    `/businesses/${businessId}/metrics/catalog`,
    { params }
  );

  return {
    funnel: { total: data.embudo.total, byOrigin: data.embudo.porOrigen },
    products: {
      mostViewed: data.productos.masVistos,
      viewedRarelyOrdered: data.productos.vistosPocoPedidos,
    },
    searches: {
      top: data.busquedas.masBuscadas,
      noResults: data.busquedas.sinResultados,
    },
    byHour: data.porHora,
    categories: data.categorias,
    featured: data.destacados,
    recommended: data.recomendados,
  };
}

/** Analítica del catálogo web con el período y la sede del dashboard. */
export function useCatalogMetrics(options?: { enabled?: boolean }) {
  const businessId = useDashboardBusinessId();
  const dateRange = useDateFilterRange();
  const branchId = useDashboardBranchId();

  return useQuery({
    queryKey: ['dashboard', 'catalog', businessId, dateRange.from, dateRange.to, branchId],
    queryFn: () => fetchCatalogMetrics(businessId!, dateRange.from, dateRange.to, branchId),
    enabled: options?.enabled !== false && !!businessId,
    staleTime: CATALOG_STALE_TIME,
    gcTime: CATALOG_GC_TIME,
  });
}

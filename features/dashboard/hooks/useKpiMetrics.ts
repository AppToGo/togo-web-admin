'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth/stores/auth.store';
import { KpiMetrics } from '../types/dashboard.types';

const KPI_STALE_TIME = 30 * 1000; // 30 seconds
const KPI_GC_TIME = 2 * 60 * 1000; // 2 minutes

async function fetchKpiMetrics(businessId: string): Promise<KpiMetrics> {
  // Mock data - replace with actual API call
  return {
    ordersToday: 25,
    ordersCompletedToday: 18,
    revenueToday: 1250000,
    revenueGrowth: 12.5,
    ordersGrowth: 8.3,
    totalOrders: 156,
    paidOrders: 142,
    pendingOrders: 14,
  };
}

export function useKpiMetrics(options?: { enabled?: boolean }) {
  const user = useCurrentUser();
  const businessId = user?.businessId;

  return useQuery({
    queryKey: ['dashboard', 'kpi', businessId],
    queryFn: () => fetchKpiMetrics(businessId!),
    enabled: options?.enabled !== false && !!businessId,
    staleTime: KPI_STALE_TIME,
    gcTime: KPI_GC_TIME,
  });
}

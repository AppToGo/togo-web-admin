'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth/stores/auth.store';
import { DetailedMetrics } from '../types/dashboard.types';

const DETAILED_STALE_TIME = 2 * 60 * 1000; // 2 minutes
const DETAILED_GC_TIME = 5 * 60 * 1000; // 5 minutes

async function fetchDetailedMetrics(businessId: string): Promise<DetailedMetrics> {
  // Mock data - replace with actual API call
  return {
    paymentMethods: [
      { method: 'CASH', count: 45, amount: 850000, percentage: 45 },
      { method: 'TRANSFER', count: 35, amount: 620000, percentage: 35 },
      { method: 'CARD', count: 20, amount: 380000, percentage: 20 },
    ],
    trendComparison: { current: 1250000, previous: 1100000, growth: 13.6 },
    conversionFunnel: {
      confirmed: 200,
      paid: 156,
      completed: 142,
      rates: { confirmedToPaid: 78, paidToCompleted: 91 },
    },
    revenueChart: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: Math.floor(Math.random() * 50000) + 30000,
    })),
    peakHours: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: Math.floor(Math.random() * 20),
    })),
  };
}

export function useDetailedMetrics(options?: { enabled?: boolean }) {
  const user = useCurrentUser();
  const businessId = user?.businessId;

  return useQuery({
    queryKey: ['dashboard', 'detailed', businessId],
    queryFn: () => fetchDetailedMetrics(businessId!),
    enabled: options?.enabled !== false && !!businessId,
    staleTime: DETAILED_STALE_TIME,
    gcTime: DETAILED_GC_TIME,
  });
}

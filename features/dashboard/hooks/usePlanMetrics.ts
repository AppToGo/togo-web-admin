'use client';

import { useCurrentUser } from '@/features/auth/stores/auth.store';
import { PLAN_METRICS_CONFIG } from '../lib/plan-metrics.config';
import { useKpiMetrics } from './useKpiMetrics';
import { useDetailedMetrics } from './useDetailedMetrics';

const PLAN_MAPPING: Record<number, string> = {
  1: 'free',
  2: 'basic',
  3: 'pro',
  4: 'enterprise',
};

export function usePlanMetrics() {
  const user = useCurrentUser();
  const planNumber = user?.subscriptionPlan || 1;

  const planKey = PLAN_MAPPING[planNumber] || 'free';
  const config = PLAN_METRICS_CONFIG[planKey];

  const kpiQuery = useKpiMetrics({ enabled: config.immediate.includes('kpi') });
  const detailedQuery = useDetailedMetrics({ enabled: config.lazy.length > 0 });

  return { kpiQuery, detailedQuery, config, planKey };
}

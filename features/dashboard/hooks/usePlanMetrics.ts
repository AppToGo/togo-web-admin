'use client';

import { useCurrentUser } from '@/features/auth/stores/auth.store';
import { PLAN_METRICS_CONFIG } from '../lib/plan-metrics.config';
import { useKpiMetrics } from './useKpiMetrics';
import { useDetailedMetrics } from './useDetailedMetrics';

export function usePlanMetrics() {
  const user = useCurrentUser();
  const planNumber = user?.business?.subscriptionPlan || 1;
  
  const planKey = planNumber === 1 ? 'free' : planNumber === 2 ? 'basic' : planNumber === 3 ? 'pro' : 'enterprise';
  const config = PLAN_METRICS_CONFIG[planKey];
  
  const kpiQuery = useKpiMetrics({ enabled: config.immediate.includes('kpi') });
  const detailedQuery = useDetailedMetrics({ enabled: config.lazy.length > 0 });

  return { kpiQuery, detailedQuery, config, planKey };
}

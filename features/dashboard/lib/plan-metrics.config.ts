import { PlanConfig } from '../types/dashboard.types';

export const PLAN_METRICS_CONFIG: Record<string, PlanConfig> = {
  free: {
    immediate: ['kpi'],
    lazy: [],
    preload: true,
  },
  basic: {
    immediate: ['kpi'],
    lazy: ['payment-methods', 'trend-comparison'],
    preload: true,
    prefetch: ['payment-methods'],
  },
  pro: {
    immediate: ['kpi'],
    lazy: ['payment-methods', 'trend-comparison', 'conversion-funnel', 'revenue-chart', 'peak-hours'],
    preload: true,
    prefetch: ['payment-methods', 'trend-comparison'],
  },
  enterprise: {
    immediate: ['kpi'],
    lazy: ['payment-methods', 'trend-comparison', 'conversion-funnel', 'revenue-chart', 'peak-hours', 'branch-comparison', 'top-customers', 'customer-stats'],
    preload: true,
    prefetch: ['payment-methods', 'trend-comparison', 'revenue-chart'],
  },
};

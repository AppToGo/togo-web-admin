export type PlanType = 'free' | 'basic' | 'pro' | 'enterprise';

export interface KpiMetrics {
  ordersToday: number;
  ordersCompletedToday: number;
  revenueToday: number;
  revenueGrowth: number;
  ordersGrowth: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
}

export interface DetailedMetrics {
  paymentMethods: PaymentMethod[];
  trendComparison: TrendComparison;
  conversionFunnel: ConversionFunnelData;
  revenueChart: RevenueChartPoint[];
  peakHours: PeakHour[];
}

export interface PaymentMethod {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface TrendComparison {
  current: number;
  previous: number;
  growth: number;
}

export interface ConversionFunnelData {
  confirmed: number;
  paid: number;
  completed: number;
  rates: {
    confirmedToPaid: number;
    paidToCompleted: number;
  };
}

export interface RevenueChartPoint {
  date: string;
  amount: number;
}

export interface PeakHour {
  hour: number;
  count: number;
}

export interface PlanConfig {
  immediate: string[];
  lazy: string[];
  preload: boolean;
  prefetch?: string[];
}

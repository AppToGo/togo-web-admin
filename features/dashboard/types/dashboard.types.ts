export interface KpiMetrics {
  ordersToday: number;
  ordersCompletedToday: number;
  periodRevenue: number;
  revenueGrowth: number;
  ordersGrowth: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
}

export interface DetailedMetrics {
  paymentMethods: PaymentMethod[];
  trendComparison: TrendComparison;
  orderStatus: OrderStatusBreakdown;
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

/** Pedidos creados en el período agrupados por su estado ACTUAL. */
export interface OrderStatusBreakdown {
  completed: number;
  /** Confirmados que todavía no se entregan (en preparación, en camino…). */
  inProgress: number;
  cancelled: number;
  /** Borradores y abandonados: nunca se confirmaron. */
  unconfirmed: number;
  /** Pedidos vivos con pago pendiente y lo que suman (con domicilio). */
  pendingPayment: { count: number; amount: number };
}

export interface RevenueChartPoint {
  date: string;
  amount: number;
}

export interface PeakHour {
  hour: number;
  count: number;
}

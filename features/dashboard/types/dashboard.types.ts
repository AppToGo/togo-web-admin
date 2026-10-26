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

/** Ventas de un producto en el período; `share` = % del total del ranking. */
export interface ProductSales {
  productId: string | null;
  name: string;
  orderCount: number;
  quantity: number;
  revenue: number;
  share: number;
}

/** Variación de unidades vs el período anterior; `changePct` null = nuevo. */
export interface ProductTrend extends ProductSales {
  previousQuantity: number;
  change: number;
  changePct: number | null;
}

export interface ProductWithoutSales {
  productId: string;
  name: string;
  image: string | null;
  category: string | null;
}

export interface ProductMetrics {
  topByQuantity: ProductSales[];
  topByRevenue: ProductSales[];
  withoutSales: { total: number; products: ProductWithoutSales[] };
  trends: { rising: ProductTrend[]; falling: ProductTrend[] };
}

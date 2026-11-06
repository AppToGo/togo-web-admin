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

// ─── Analítica del catálogo (flag CATALOG_ANALYTICS) ─────────────────────────

/** Sesiones del catálogo por etapa; `origin` = 'total' en la fila de todos. */
export interface CatalogFunnelStage {
  origin: string;
  sessions: number;
  viewedProduct: number;
  addedToCart: number;
  startedCheckout: number;
  placedOrder: number;
  abandonedCarts: number;
  conversionRate: number;
}

export interface CatalogProductMetric {
  productId: string;
  name: string;
  image: string | null;
  views: number;
  viewers: number;
  addedToCart: number;
  orders: number;
  units: number;
  viewToCartRate: number;
  viewToOrderRate: number;
}

export interface CatalogSearchMetric {
  query: string;
  searches: number;
  sessions: number;
  noResults: number;
}

export interface CatalogMetrics {
  funnel: { total: CatalogFunnelStage; byOrigin: CatalogFunnelStage[] };
  products: {
    mostViewed: CatalogProductMetric[];
    viewedRarelyOrdered: CatalogProductMetric[];
  };
  searches: { top: CatalogSearchMetric[]; noResults: CatalogSearchMetric[] };
  byHour: Array<{ hour: number; sessions: number; orders: number }>;
  categories: Array<{ categoryId: string; name: string; views: number; sessions: number }>;
  featured: { clicks: number; addedToCart: number; rate: number };
  recommended: { added: number; shareOfAdds: number };
}

// ─── Calificaciones (flag PRODUCT_REVIEWS) ───────────────────────────────────

export interface ProductReviewItem {
  id: string;
  productId: string;
  productName: string;
  rating: number;
  comment: string | null;
  hidden: boolean;
  createdAt: string;
  orderNumber: string;
}

export interface RatedProduct {
  productId: string;
  name: string;
  image: string | null;
  ratingAvg: number | null;
  ratingCount: number;
}

export type SurveyQuestion =
  | "overall"
  | "time"
  | "condition"
  | "place"
  | "service"
  | "bot"
  | "recommend";

export type OrderDeliveryType = "DELIVERY" | "PICKUP" | "DINE_IN" | "COUNTER";

/** Encuesta de satisfacción del pedido (todas las preguntas de 1 a 5). */
export interface SurveySummary {
  total: number;
  /** Promedio sobre quienes respondieron cada pregunta. */
  questions: Array<{
    question: SurveyQuestion;
    average: number | null;
    answers: number;
  }>;
  /** Tiempo por tipo de pedido: cada tipo tiene su propia pregunta. */
  timeByType: Array<{
    deliveryType: OrderDeliveryType | null;
    average: number | null;
    answers: number;
  }>;
  /** % que respondió 4 o 5 a si recomendaría el negocio. */
  recommendShare: number | null;
  recent: Array<{
    id: string;
    orderNumber: string;
    overallRating: number;
    comment: string | null;
    createdAt: string;
  }>;
}

export interface ProductReviewsSummary {
  total: number;
  average: number | null;
  distribution: Array<{ stars: number; count: number }>;
  /** Mejor y peor calificados; solo productos con 3+ calificaciones. */
  best: RatedProduct[];
  worst: RatedProduct[];
  recent: ProductReviewItem[];
  survey: SurveySummary;
}

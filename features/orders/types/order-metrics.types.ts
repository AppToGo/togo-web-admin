/**
 * Order Metrics Types
 *
 * Tipado estricto para las métricas de órdenes del endpoint /metrics.
 * Basado en el OrderMetricsResponseDto del backend.
 */

import type { OrderStatus } from "./order.types";

/**
 * Período de tiempo para filtrar métricas
 */
export interface OrderMetricsPeriod {
  desde?: string;
  hasta?: string;
}

/**
 * Conteos generales de órdenes
 */
export interface OrderMetricsCounts {
  total: number;
  pagadas: number;
  pendientesPago: number;
  hoy: number;
  completadasHoy: number;
}

/**
 * Métricas por tipo de entrega
 */
export interface DeliveryTypeMetrics {
  total: number;
  pagadas: number;
  pendientesPago: number;
}

/**
 * Recaudo desglosado (subtotal, delivery, total)
 */
export interface RecaudoBreakdown {
  subtotal: number;
  delivery: number;
  total: number;
}

/**
 * Recaudos por estado de pago
 */
export interface RecaudoByPaymentStatus {
  pagadas: RecaudoBreakdown;
  pendientesPago: RecaudoBreakdown;
}

/**
 * Métricas de recaudos completas
 */
export interface OrderMetricsRevenue {
  pagadas: RecaudoBreakdown;
  pendientesPago: RecaudoBreakdown;
  delivery: RecaudoByPaymentStatus;
  pickup: RecaudoByPaymentStatus;
  dineIn: RecaudoByPaymentStatus;
}

/**
 * Promedios de valor de orden
 */
export interface OrderMetricsAverages {
  valorOrden: number;
  valorOrdenPagada: number;
  valorOrdenDelivery: number;
  valorOrdenPickup: number;
}

/**
 * Métrica comparativa con período anterior
 */
export interface ComparativeMetric {
  valor: number;
  valorAnterior: number;
  crecimiento: number;
}

/**
 * Comparativa de métricas
 */
export interface OrderMetricsComparative {
  recaudoTotal: ComparativeMetric;
  ordenesTotales: ComparativeMetric;
}

/**
 * Métrica por método de pago
 */
export interface PaymentMethodMetric {
  metodo: string;
  cantidad: number;
  monto: number;
  porcentaje: number;
}

/**
 * Métrica por hora pico
 */
export interface PeakHourMetric {
  hora: number;
  cantidad: number;
}

/**
 * Tasas de conversión del funnel
 */
export interface ConversionRates {
  confirmacion: number;
  pago: number;
  completitud: number;
  cancelacion: number;
  abandono: number;
}

/**
 * Respuesta completa del endpoint /metrics
 */
export interface OrderMetricsResponse {
  businessId: string;
  generadoEn: string;
  periodo: OrderMetricsPeriod;
  conteos: OrderMetricsCounts;
  porEstadoOrden: Record<OrderStatus, number>;
  porTipoEntrega: {
    DELIVERY: DeliveryTypeMetrics;
    PICKUP: DeliveryTypeMetrics;
    DINE_IN: DeliveryTypeMetrics;
  };
  recaudos: OrderMetricsRevenue;
  promedios: OrderMetricsAverages;
  comparativa: OrderMetricsComparative;
  metodosPago: PaymentMethodMetric[];
  horasPico: PeakHourMetric[];
  tasasConversion: ConversionRates;
}

/**
 * Parámetros para consultar métricas
 */
export interface GetOrderMetricsParams {
  businessId?: string;
  dateFrom?: string;
  dateTo?: string;
  branchId?: string;
  branchIds?: string[];
}

/**
 * Datos procesados para el dashboard
 */
export interface DashboardMetricsData {
  ordersToday: number;
  ordersCompletedToday: number;
  revenueToday: number;
  revenueGrowth: number;
  ordersGrowth: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
}

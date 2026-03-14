// Export all hooks from the orders feature
export {
  useOrders,
  useOrdersByStatus,
  useOrder,
  useOrderHistory,
  useUpdateOrderStatus,
  useRecentActivity,
} from './useOrders';

// Nuevos hooks de métricas basados en el endpoint /metrics
export {
  useOrderMetrics,
  useDashboardMetrics,
  useDetailedMetrics,
} from './useOrderMetrics';

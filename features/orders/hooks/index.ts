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

// Hooks para manejo de sesión de sucursales
export {
  useUserBranches,
  useHasBranchAccess,
  useDefaultBranch,
  AUTH_SESSION_KEY,
} from './useUserBranches';

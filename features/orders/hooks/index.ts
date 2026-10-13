// Export all hooks from the orders feature
export {
  useOrders,
  useOrdersByStatus,
  useOrder,
  useOrderHistory,
  useUpdateOrderStatus,
  useRecentActivity,
  useLiveOrders,
  useCreateOrder,
} from './useOrders';

// Infinite scroll hooks for archive orders
export {
  useCompletedOrdersInfinite,
} from './useCompletedOrders';

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

// Drop target for dragged order cards
export { useOrderDropZone } from './useOrderDropZone';

// WebSocket realtime orders hook
export { useOrdersRealtime } from './useOrdersRealtime';
export type { RealtimeState } from './useOrdersRealtime';

// Badge de Pedidos del sidebar (pedidos nuevos sin ver)
export { useUnseenOrdersCount, useMarkOrderViewed } from './useUnseenOrders';

// Flujo del tablero del negocio (estados que usa) y retroceso con permiso
export {
  useOrderFlow,
  useBusinessOrderFlow,
  useUpdateBusinessOrderFlow,
} from './useOrderFlow';

// Comprobante de pago (transferencias)
export { useOrderPaymentProof, paymentProofKey } from './useOrderPaymentProof';

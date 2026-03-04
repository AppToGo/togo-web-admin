/**
 * Orders Hooks
 *
 * Hooks con React Query para manejar el estado de órdenes.
 * - Caching optimizado
 * - Revalidación automática
 * - Optimistic UI para cambios de estado
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import {
  getOrders,
  getOrderById,
  updateOrderStatus,
  getOrderStatusHistory,
} from "../services/order.service";
import type {
  Order,
  OrderStatus,
  UpdateOrderStatusRequest,
  GetOrdersParams,
} from "../types";

// Query keys para mantener consistencia
const ORDERS_KEYS = {
  all: ["orders"] as const,
  lists: () => [...ORDERS_KEYS.all, "list"] as const,
  list: (filters: GetOrdersParams) =>
    [...ORDERS_KEYS.lists(), filters] as const,
  details: () => [...ORDERS_KEYS.all, "detail"] as const,
  detail: (id: string) => [...ORDERS_KEYS.details(), id] as const,
  history: (id: string) => [...ORDERS_KEYS.detail(id), "history"] as const,
};

// Stale times configurables
const STALE_TIME = 30 * 1000; // 30 segundos
const GC_TIME = 5 * 60 * 1000; // 5 minutos

/**
 * Hook para obtener todas las órdenes
 *
 * @param params - Filtros y paginación
 */
export function useOrders(params?: GetOrdersParams) {
  return useQuery({
    queryKey: ORDERS_KEYS.list(params || {}),
    queryFn: () => getOrders(params),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: (failureCount, error) => {
      // No reintentar en errores 401 o 403
      if (error instanceof Error) {
        const message = error.message;
        if (message.includes("401") || message.includes("403")) {
          return false;
        }
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook para obtener órdenes agrupadas por estado (para Kanban)
 */
export function useOrdersByStatus() {
  const { data: orders, ...rest } = useOrders();

  const ordersByStatus = useMemo(() => {
    if (!orders) return {} as Record<OrderStatus, Order[]>;

    const grouped = {} as Record<OrderStatus, Order[]>;

    // Inicializar todos los estados con arrays vacíos
    const allStatuses: OrderStatus[] = [
      "DRAFT",
      "CONFIRMED",
      "PAYMENT_PENDING",
      "PAID",
      "IN_PROGRESS",
      "READY",
      "ON_THE_WAY",
      "COMPLETED",
      "CANCELLED",
      "ABANDONED",
    ];

    allStatuses.forEach((status) => {
      grouped[status] = [];
    });

    // Agrupar órdenes
    orders.forEach((order) => {
      if (!grouped[order.status]) {
        grouped[order.status] = [];
      }
      grouped[order.status].push(order);
    });

    // Ordenar por fecha descendente dentro de cada grupo
    Object.keys(grouped).forEach((status) => {
      grouped[status as OrderStatus].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    return grouped;
  }, [orders]);

  return {
    ordersByStatus,
    orders,
    ...rest,
  };
}

/**
 * Hook para obtener una orden específica
 *
 * @param orderId - ID de la orden
 * @param enabled - Si la query está habilitada
 */
export function useOrder(orderId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ORDERS_KEYS.detail(orderId || ""),
    queryFn: () => getOrderById(orderId!),
    enabled: !!orderId && enabled,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Hook para obtener el historial de una orden
 *
 * @param orderId - ID de la orden
 */
export function useOrderHistory(orderId: string | null) {
  return useQuery({
    queryKey: ORDERS_KEYS.history(orderId || ""),
    queryFn: () => getOrderStatusHistory(orderId!),
    enabled: !!orderId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Hook para actualizar el estado de una orden
 *
 * Implementa optimistic UI con rollback automático
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: UpdateOrderStatusRequest;
    }) => updateOrderStatus(orderId, data),

    // Optimistic update
    onMutate: async ({ orderId, data }) => {
      // Cancelar queries en vuelo
      await queryClient.cancelQueries({ queryKey: ORDERS_KEYS.all });

      // Guardar estado anterior para rollback
      const previousOrders = queryClient.getQueryData<Order[]>(
        ORDERS_KEYS.lists()
      );
      const previousOrder = queryClient.getQueryData<Order>(
        ORDERS_KEYS.detail(orderId)
      );

      // Actualizar lista de órdenes
      queryClient.setQueriesData<Order[]>(
        { queryKey: ORDERS_KEYS.lists() },
        (old: Order[] | undefined) => {
          if (!old) return old;
          return old.map((order) =>
            order.id === orderId ? { ...order, status: data.status } : order
          );
        }
      );

      // Actualizar detalle de orden
      queryClient.setQueryData<Order>(ORDERS_KEYS.detail(orderId), (old) => {
        if (!old) return old;
        return { ...old, status: data.status };
      });

      return { previousOrders, previousOrder };
    },

    // Rollback en error
    onError: (_err, { orderId }, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(ORDERS_KEYS.lists(), context.previousOrders);
      }
      if (context?.previousOrder) {
        queryClient.setQueryData(
          ORDERS_KEYS.detail(orderId),
          context.previousOrder
        );
      }
    },

    // Revalidar después de la mutación
    onSettled: (_data, _error, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.history(orderId) });
    },
  });
}

/**
 * Hook para calcular métricas del dashboard
 */
export function useOrderMetrics() {
  const { data: orders } = useOrders();

  return useMemo(() => {
    if (!orders) {
      return {
        totalOrders: 0,
        pendingOrders: 0,
        inProgressOrders: 0,
        completedToday: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pendingStatuses: OrderStatus[] = [
      "DRAFT",
      "CONFIRMED",
      "PAYMENT_PENDING",
    ];
    const inProgressStatuses: OrderStatus[] = [
      "PAID",
      "IN_PROGRESS",
      "READY",
      "ON_THE_WAY",
    ];

    const pendingOrders = orders.filter((o) =>
      pendingStatuses.includes(o.status)
    );
    const inProgressOrders = orders.filter((o) =>
      inProgressStatuses.includes(o.status)
    );
    const completedToday = orders.filter(
      (o) => o.status === "COMPLETED" && new Date(o.updatedAt) >= today
    );

    const totalRevenue = completedToday.reduce(
      (sum, o) => sum + o.totalAmount,
      0
    );
    const averageOrderValue =
      completedToday.length > 0 ? totalRevenue / completedToday.length : 0;

    return {
      totalOrders: orders.length,
      pendingOrders: pendingOrders.length,
      inProgressOrders: inProgressOrders.length,
      completedToday: completedToday.length,
      totalRevenue,
      averageOrderValue,
    };
  }, [orders]);
}

/**
 * Hook para obtener actividad reciente
 */
export function useRecentActivity() {
  const { data: orders } = useOrders();

  return useMemo(() => {
    if (!orders) return [];

    // Tomar las 10 órdenes más recientes
    const recentOrders = [...orders]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, 10);

    return recentOrders.map((order) => ({
      id: order.id,
      type: "status_change" as const,
      orderId: order.id,
      customerName: order.customer?.name || "Cliente desconocido",
      description: `Orden #${order.id.slice(-6)} - ${getStatusLabel(order.status)}`,
      timestamp: new Date(order.updatedAt),
    }));
  }, [orders]);
}

/**
 * Utilidad para obtener etiqueta legible de estado
 */
function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    DRAFT: "Borrador",
    CONFIRMED: "Confirmada",
    PAYMENT_PENDING: "Pago pendiente",
    PAID: "Pagada",
    IN_PROGRESS: "En preparación",
    READY: "Lista",
    ON_THE_WAY: "En camino",
    COMPLETED: "Completada",
    CANCELLED: "Cancelada",
    ABANDONED: "Abandonada",
  };
  return labels[status] || status;
}

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
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useBusinessStore } from "@/features/business/stores/business.store";
import { useDateFilterParams } from "@/features/filters/hooks/useDateFilterQuery";
import { toast } from "sonner";
import {
  getOrders,
  getOrderById,
  updateOrderStatus,
  getOrderStatusHistory,
  updateOrderPaymentStatus,
  getBusinesses,
  type UpdatePaymentStatusRequest,
} from "../services/order.service";
import type {
  Order,
  OrderStatus,
  UpdateOrderStatusRequest,
  GetOrdersParams,
} from "../types";
import { getHumanizedErrorMessage } from "@/lib/error.utils";

// Query keys para mantener consistencia
const ORDERS_KEYS = {
  all: ["orders"] as const,
  lists: () => [...ORDERS_KEYS.all, "list"] as const,
  list: (filters: GetOrdersParams) =>
    [...ORDERS_KEYS.lists(), JSON.stringify(filters)] as const,
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
 * Usa automáticamente los filtros de fecha globales del store.
 * Los parámetros de fecha en `params` sobreescriben los filtros globales.
 *
 * @param params - Filtros y paginación
 */
export function useOrders(params?: GetOrdersParams & { businessId?: string }) {
  const dateParams = useDateFilterParams();
  const { user } = useAuthStore.getState();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const hasBusinessId = !!user?.businessId;
  const hasSelectedBusiness = params?.businessId !== undefined;
  const isEnabled = isSuperAdmin ? hasSelectedBusiness : hasBusinessId;

  // Merge de parámetros: filtros globales tienen prioridad base
  const mergedParams = {
    ...dateParams,
    ...params,
  };

  return useQuery({
    queryKey: ORDERS_KEYS.list(mergedParams),
    queryFn: () => getOrders(mergedParams),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: isEnabled,
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

interface UseOrdersByStatusParams {
  dateFrom?: string;
  dateTo?: string;
  businessId?: string; // Para SUPER_ADMIN que puede ver cualquier negocio
  skipDateFilter?: boolean; // Si es true, no usa los filtros globales de fecha
}

/**
 * Hook para obtener órdenes agrupadas por estado (para Kanban)
 *
 * Por defecto usa los filtros de fecha globales.
 * Si se pasa `skipDateFilter: true`, ignora los filtros globales.
 * Si se pasan `dateFrom`/`dateTo`, sobreescriben los filtros globales.
 */
export function useOrdersByStatus(params?: UseOrdersByStatusParams) {
  const dateParams = useDateFilterParams();

  // Construir params finales
  const finalParams = params?.skipDateFilter
    ? params
    : {
        ...dateParams,
        ...params,
      };

  const { data: orders, ...rest } = useOrders(finalParams);

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
  const { selectedBusinessId } = useBusinessStore();
  const { user } = useAuthStore();

  // Determinar el businessId efectivo
  const effectiveBusinessId =
    selectedBusinessId || user?.businessId || undefined;

  return useQuery({
    queryKey: [...ORDERS_KEYS.detail(orderId || ""), effectiveBusinessId],
    queryFn: () => getOrderById(orderId!, effectiveBusinessId),
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
  const { selectedBusinessId } = useBusinessStore();
  const { user } = useAuthStore();

  // Determinar el businessId efectivo
  const effectiveBusinessId =
    selectedBusinessId || user?.businessId || undefined;

  return useQuery({
    queryKey: [...ORDERS_KEYS.history(orderId || ""), effectiveBusinessId],
    queryFn: () => getOrderStatusHistory(orderId!, effectiveBusinessId),
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
  const { selectedBusinessId } = useBusinessStore();
  const { user } = useAuthStore();

  // Determinar el businessId efectivo
  const effectiveBusinessId =
    selectedBusinessId || user?.businessId || undefined;

  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: UpdateOrderStatusRequest;
    }) => updateOrderStatus(orderId, data, effectiveBusinessId),

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
    onError: (err, { orderId }, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(ORDERS_KEYS.lists(), context.previousOrders);
      }
      if (context?.previousOrder) {
        queryClient.setQueryData(
          ORDERS_KEYS.detail(orderId),
          context.previousOrder
        );
      }
      // Extraer mensaje de error del backend
      const errorMessage = getHumanizedErrorMessage(err);
      toast.error(
        errorMessage || "No se pudo actualizar el estado de la orden"
      );
    },

    // Éxito
    onSuccess: (_data, { data }) => {
      toast.success(`Estado actualizado a "${data.status}"`);
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
 * Hook para actualizar el estado de pago de una orden
 *
 * Implementa optimistic UI con rollback automático
 */
export function useUpdateOrderPaymentStatus() {
  const queryClient = useQueryClient();
  const { selectedBusinessId } = useBusinessStore();
  const { user } = useAuthStore();

  // Determinar el businessId efectivo
  const effectiveBusinessId =
    selectedBusinessId || user?.businessId || undefined;

  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: UpdatePaymentStatusRequest;
    }) => updateOrderPaymentStatus(orderId, data, effectiveBusinessId),

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
            order.id === orderId
              ? { ...order, paymentStatus: data.paymentStatus }
              : order
          );
        }
      );

      // Actualizar detalle de orden
      queryClient.setQueryData<Order>(ORDERS_KEYS.detail(orderId), (old) => {
        if (!old) return old;
        return { ...old, paymentStatus: data.paymentStatus };
      });

      return { previousOrders, previousOrder };
    },

    // Rollback en error
    onError: (err, { orderId }, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(ORDERS_KEYS.lists(), context.previousOrders);
      }
      if (context?.previousOrder) {
        queryClient.setQueryData(
          ORDERS_KEYS.detail(orderId),
          context.previousOrder
        );
      }
      // Extraer mensaje de error del backend
      const errorMessage = getHumanizedErrorMessage(err);
      toast.error(errorMessage || "No se pudo actualizar el estado de pago");
    },

    // Éxito
    onSuccess: (_data) => {
      toast.success("Estado de pago actualizado");
    },

    // Revalidar después de la mutación
    onSettled: (_data, _error, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.detail(orderId) });
    },
  });
}

/**
 * Hook para obtener actividad reciente
 */
export function useRecentActivity() {
  const { selectedBusinessId } = useBusinessStore();
  const { user } = useAuthStore();

  // Determinar el businessId efectivo (igual que otros hooks)
  const effectiveBusinessId =
    selectedBusinessId || user?.businessId || undefined;

  const { data: orders } = useOrders({ businessId: effectiveBusinessId });

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
    IN_PROGRESS: "En proceso",
    READY: "Lista",
    ON_THE_WAY: "En camino",
    COMPLETED: "Completada",
    CANCELLED: "Cancelada",
    ABANDONED: "Abandonada",
  };
  return labels[status] || status;
}

// Query key para negocios
const BUSINESSES_KEY = ["businesses"];

/**
 * Hook para obtener lista de negocios (solo SUPER_ADMIN)
 */
export function useBusinesses() {
  return useQuery({
    queryKey: BUSINESSES_KEY,
    queryFn: () => getBusinesses(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

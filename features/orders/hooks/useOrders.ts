/**
 * Orders Hooks
 *
 * Hooks with React Query for managing order state.
 * - Optimized caching
 * - Automatic revalidation
 * - Optimistic UI for status changes
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
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
  getLiveOrders,
  type UpdatePaymentStatusRequest,
} from "../services/order.service";
import type {
  Order,
  OrderStatus,
  UpdateOrderStatusRequest,
  GetOrdersParams,
} from "../types";
import { getHumanizedErrorMessage } from "@/lib/error.utils";
import { useStatusLabels } from "../utils/order-status.utils";
import { LIVE_STATUSES } from "../constants/order-statuses";
import {
  ORDERS_KEYS,
  type LiveOrdersFilters,
} from "../types/order-cache.types";

// Stale times configurables
const STALE_TIME = 30 * 1000; // 30 seconds
const GC_TIME = 5 * 60 * 1000; // 5 minutes

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
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const hasBusinessId = !!user?.businessId;
  const hasSelectedBusiness = params?.businessId !== undefined;
  const isEnabled = isSuperAdmin ? hasSelectedBusiness : hasBusinessId;

  // Determinar el businessId efectivo:
  // 1. Si se pasa explícitamente en params, usar ese
  // 2. Si no, usar el del usuario autenticado
  // Esto asegura que la query key incluya el businessId correcto para cacheo
  const effectiveBusinessId = params?.businessId ?? user?.businessId ?? undefined;

  // Merge de parámetros: filtros globales tienen prioridad base
  // Incluir explicitamente el businessId efectivo para la query key
  const mergedParams = {
    ...dateParams,
    ...params,
    businessId: effectiveBusinessId,
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
  branchIds?: string[]; // Filtrar por sucursales seleccionadas
  skipDateFilter?: boolean; // Si es true, no usa los filtros globales de fecha
}

/**
 * Hook para obtener órdenes LIVE agrupadas por estado (para Kanban)
 *
 * Solo carga órdenes con estados LIVE (no COMPLETED).
 * Por defecto usa los filtros de fecha globales.
 * Si se pasa `skipDateFilter: true`, ignora los filtros globales.
 * Si se pasan `dateFrom`/`dateTo`, sobreescriben los filtros globales.
 * Si se pasan `branchIds`, filtra por esas sucursales.
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

  const { data: orders, ...rest } = useLiveOrders(finalParams);

  const ordersByStatus = useMemo(() => {
    if (!orders) return {} as Record<OrderStatus, Order[]>;

    const grouped = {} as Record<OrderStatus, Order[]>;

    // Inicializar solo los estados LIVE con arrays vacíos
    LIVE_STATUSES.forEach((status) => {
      grouped[status] = [];
    });

    // Agrupar órdenes (solo LIVE, ya que el servicio filtra)
    orders.forEach((order) => {
      if (grouped[order.status]) {
        grouped[order.status].push(order);
      }
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
 * Hook para obtener órdenes en vivo (estados activos)
 *
 * Usa el endpoint optimizado para órdenes LIVE.
 * Los estados LIVE incluyen todos excepto COMPLETED.
 */
export function useLiveOrders(filters: LiveOrdersFilters) {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const hasBusinessId = !!user?.businessId;
  const hasSelectedBusiness = filters.businessId !== undefined;
  const isEnabled = isSuperAdmin ? hasSelectedBusiness : hasBusinessId;

  // Determinar el businessId efectivo
  const effectiveBusinessId =
    filters.businessId ?? user?.businessId ?? undefined;

  return useQuery({
    queryKey: ORDERS_KEYS.live(filters.businessId, filters),
    queryFn: () =>
      getLiveOrders({
        ...filters,
        businessId: effectiveBusinessId,
        statuses: LIVE_STATUSES,
      }),
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
 * Hook to update order status
 *
 * Implements optimistic UI with automatic rollback
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { selectedBusinessId } = useBusinessStore();
  const { user } = useAuthStore();
  const t = useTranslations("orders");
  const statusLabels = useStatusLabels();

  // Determine effective businessId
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
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: ORDERS_KEYS.all });

      // Save previous state for rollback
      const previousOrders = queryClient.getQueryData<Order[]>(
        ORDERS_KEYS.lists()
      );
      const previousOrder = queryClient.getQueryData<Order>(
        ORDERS_KEYS.detail(orderId)
      );

      // Update orders list
      queryClient.setQueriesData<Order[]>(
        { queryKey: ORDERS_KEYS.lists() },
        (old: Order[] | undefined) => {
          if (!old) return old;
          return old.map((order) =>
            order.id === orderId ? { ...order, status: data.status } : order
          );
        }
      );

      // Update order detail
      queryClient.setQueryData<Order>(ORDERS_KEYS.detail(orderId), (old) => {
        if (!old) return old;
        return { ...old, status: data.status };
      });

      return { previousOrders, previousOrder };
    },

    // Rollback on error
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
      // Extract error message from backend
      const errorMessage = getHumanizedErrorMessage(err);
      toast.error(errorMessage || t("errors.updateStatusFailed"));
    },

    // Success
    onSuccess: (_data, { data }) => {
      const statusLabel = statusLabels[data.status];
      toast.success(t("statusUpdated", { status: statusLabel }));
    },

    // Revalidate after mutation
    onSettled: (_data, _error, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.history(orderId) });
    },
  });
}

/**
 * Hook to update order payment status
 *
 * Implements optimistic UI with automatic rollback
 */
export function useUpdateOrderPaymentStatus() {
  const queryClient = useQueryClient();
  const { selectedBusinessId } = useBusinessStore();
  const { user } = useAuthStore();
  const t = useTranslations("orders");

  // Determine effective businessId
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
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: ORDERS_KEYS.all });

      // Save previous state for rollback
      const previousOrders = queryClient.getQueryData<Order[]>(
        ORDERS_KEYS.lists()
      );
      const previousOrder = queryClient.getQueryData<Order>(
        ORDERS_KEYS.detail(orderId)
      );

      // Update orders list
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

      // Update order detail
      queryClient.setQueryData<Order>(ORDERS_KEYS.detail(orderId), (old) => {
        if (!old) return old;
        return { ...old, paymentStatus: data.paymentStatus };
      });

      return { previousOrders, previousOrder };
    },

    // Rollback on error
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
      // Extract error message from backend
      const errorMessage = getHumanizedErrorMessage(err);
      toast.error(errorMessage || t("errors.updatePaymentFailed"));
    },

    // Success
    onSuccess: (_data) => {
      toast.success(t("paymentStatusUpdated"));
    },

    // Revalidate after mutation
    onSettled: (_data, _error, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.detail(orderId) });
    },
  });
}

/**
 * Hook to get recent activity
 */
export function useRecentActivity() {
  const { selectedBusinessId } = useBusinessStore();
  const { user } = useAuthStore();
  const t = useTranslations("orders");

  // Determine effective businessId (same as other hooks)
  const effectiveBusinessId =
    selectedBusinessId || user?.businessId || undefined;

  const { data: orders } = useOrders({ businessId: effectiveBusinessId });

  return useMemo(() => {
    if (!orders) return [];

    // Take the 10 most recent orders
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
      customerName: order.customer?.name || t("unknownCustomer"),
      description: t("orderNumber", { id: order.id.slice(-6) }),
      timestamp: new Date(order.updatedAt),
    }));
  }, [orders, t]);
}



// Query key para negocios
const BUSINESSES_KEY = ["businesses"];

/**
 * Hook para obtener lista de negocios (solo SUPER_ADMIN)
 */
export function useBusinesses(options?: { enabled?: boolean }) {
  const { enabled = true } = options || {};
  return useQuery({
    queryKey: BUSINESSES_KEY,
    queryFn: () => getBusinesses(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    enabled,
  });
}

"use client";

import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { KanbanColumn } from "./KanbanColumn";
import { OrderDetailDialog } from "./OrderDetailDialog";
import { OrderMetrics, OrderMetricsSkeleton } from "./OrderMetrics";

import {
  ColumnVisibilityBar,
  type ColumnVisibilityConfig,
} from "./ColumnVisibilityBar";

import {
  useOrdersByStatus,
  useUpdateOrderStatus,
  useCompletedOrdersInfinite,
  useOrderMetrics,
} from "../hooks";
import { useHydrateNotificationPreferences } from "@/features/notifications/stores";
import type { Order, OrderStatus } from "../types";
import {
  getKanbanColumns,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getDeliveryTypeLabel,
} from "../utils/order-status.utils";
import type { CardViewMode } from "./OrderCard";

interface OrdersKanbanBoardProps {
  searchQuery?: string;
  cardViewMode?: CardViewMode;
  dateFrom?: string;
  dateTo?: string;
  businessId?: string; // Para SUPER_ADMIN
  branchIds?: string[]; // Filtrar por sucursales seleccionadas
  paymentStatusFilter?: {
    paid: boolean;
    pending: boolean;
  };
  deliveryTypeFilter?: {
    delivery: boolean;
    pickup: boolean;
  };
}

function formatOrderNumber(id: string): string {
  return `#${id.slice(0, 6).toUpperCase()}`;
}

function filterOrdersBySearch(
  orders: Order[] | undefined,
  query: string
): Order[] {
  if (!orders || !query.trim()) return orders || [];

  const lowerQuery = query.toLowerCase();
  return orders.filter((order) => {
    const orderNumber = formatOrderNumber(order.id).toLowerCase();
    const customerName = order.customer?.name?.toLowerCase() || "";
    const productNames =
      order.items?.map((i) => i.productName.toLowerCase()).join(" ") || "";
    const address = order.address?.addressText?.toLowerCase() || "";

    // Buscar por valores formateados (lo que ve el usuario en UI)
    const paymentMethodLabel = getPaymentMethodLabel(
      order.paymentMethod
    ).toLowerCase();
    const paymentStatusLabel = getPaymentStatusLabel(
      order.paymentStatus
    ).toLowerCase();
    const deliveryTypeLabel = getDeliveryTypeLabel(
      order.deliveryType
    ).toLowerCase();

    // También buscar por valores crudos (para compatibilidad)
    const paymentMethodRaw = order.paymentMethod?.toLowerCase() || "";
    const paymentStatusRaw = order.paymentStatus?.toLowerCase() || "";
    const deliveryTypeRaw = order.deliveryType?.toLowerCase() || "";

    return (
      orderNumber.includes(lowerQuery) ||
      customerName.includes(lowerQuery) ||
      productNames.includes(lowerQuery) ||
      address.includes(lowerQuery) ||
      paymentMethodLabel.includes(lowerQuery) ||
      paymentStatusLabel.includes(lowerQuery) ||
      deliveryTypeLabel.includes(lowerQuery) ||
      paymentMethodRaw.includes(lowerQuery) ||
      paymentStatusRaw.includes(lowerQuery) ||
      deliveryTypeRaw.includes(lowerQuery)
    );
  });
}

export function OrdersKanbanBoard({
  searchQuery = "",
  cardViewMode = "card",
  dateFrom,
  dateTo,
  businessId,
  branchIds,
  paymentStatusFilter = { paid: true, pending: true },
  deliveryTypeFilter = { delivery: true, pickup: true },
}: OrdersKanbanBoardProps) {
  // Hydrate notification preferences when the orders page mounts
  useHydrateNotificationPreferences();

  // Get metrics for total counts per status
  const { data: metrics } = useOrderMetrics();

  // Estado local del sidebar de estadísticas
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityConfig>({
      CONFIRMED: true,
      IN_PROGRESS: true,
      READY: true,
      COMPLETED: true,
    });
  // Estado para el dialog de detalle (un solo dialog para todas las órdenes)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const isDetailOpen = !!selectedOrderId;

  // Hook for LIVE orders (all except COMPLETED)
  const {
    ordersByStatus,
    isLoading: isLoadingLive,
    error: errorLive,
  } = useOrdersByStatus({
    dateFrom,
    dateTo,
    businessId,
    branchIds,
  });

  // Hook for COMPLETED orders (infinite scroll)
  // Solo habilitar si hay businessId (no pasar string vacío)
  const {
    orders: completedOrders,
    isLoading: isLoadingCompleted,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error: errorCompleted,
  } = useCompletedOrdersInfinite({
    businessId: businessId,
    dateFrom,
    dateTo,
    branchIds,
  });

  const updateStatus = useUpdateOrderStatus();

  // Combine errors
  const error = errorLive || errorCompleted;

  const allColumns = useMemo(() => getKanbanColumns(), []);

  // Filter columns based on visibility
  const columns = useMemo(() => {
    return allColumns.filter((column) => {
      const key = column.id as keyof ColumnVisibilityConfig;
      return columnVisibility[key] ?? true;
    });
  }, [allColumns, columnVisibility]);

  const visibleColumnCount = columns.length;

  // Filtrar órdenes por búsqueda y filtros adicionales
  const filteredOrdersByStatus = useMemo(() => {
    // Start with LIVE orders from useOrdersByStatus
    const baseOrders = ordersByStatus
      ? { ...ordersByStatus }
      : ({} as Record<OrderStatus, Order[]>);

    // Add COMPLETED orders from infinite scroll
    if (completedOrders) {
      baseOrders["COMPLETED"] = completedOrders;
    }

    const filtered: Record<OrderStatus, Order[]> = {} as any;
    Object.entries(baseOrders).forEach(([status, statusOrders]) => {
      let result = statusOrders;

      // Filtro por búsqueda
      if (searchQuery.trim()) {
        result = filterOrdersBySearch(result, searchQuery);
      }

      // Filtro por estado de pago
      if (!paymentStatusFilter.paid || !paymentStatusFilter.pending) {
        result = result.filter((order) => {
          if (order.paymentStatus === "PAID" && !paymentStatusFilter.paid)
            return false;
          if (order.paymentStatus === "PENDING" && !paymentStatusFilter.pending)
            return false;
          return true;
        });
      }

      // Filtro por tipo de envío
      if (!deliveryTypeFilter.delivery || !deliveryTypeFilter.pickup) {
        result = result.filter((order) => {
          // Usar deliveryType si está disponible, sino usar addressId como fallback
          const isDelivery = order.deliveryType
            ? order.deliveryType === "DELIVERY"
            : !!order.addressId;
          if (isDelivery && !deliveryTypeFilter.delivery) return false;
          if (!isDelivery && !deliveryTypeFilter.pickup) return false;
          return true;
        });
      }

      filtered[status as OrderStatus] = result;
    });
    return filtered;
  }, [
    ordersByStatus,
    completedOrders,
    searchQuery,
    paymentStatusFilter,
    deliveryTypeFilter,
  ]);

  const handleStatusChange = useCallback(
    (orderId: string, newStatus: string) => {
      updateStatus.mutate({
        orderId,
        data: { status: newStatus as OrderStatus },
      });
    },
    [updateStatus]
  );

  const handleOrderClick = useCallback((orderId: string) => {
    setSelectedOrderId(orderId);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedOrderId(null);
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Error al cargar órdenes
        </h3>
        <p className="text-sm text-slate-500 max-w-sm">
          No se pudieron cargar las órdenes. Por favor, intenta de nuevo más
          tarde.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Contenedor principal - sin overflow para evitar scroll global */}
      <div className="flex flex-row flex-1 min-h-0 overflow-hidden">
        {/* Main Kanban Container - con overflow controlado */}
        <div
          data-tour-step="kanban-board"
          className={cn(
            "relative rounded-card-xl flex flex-col min-h-0 overflow-hidden",
            "bg-white/30 backdrop-blur-xl border border-white/40",
            "transition-all duration-300 ease-in-out",
            "flex-1"
          )}
        >
          {/* Scroll horizontal solo aquí */}
          <div className="flex-1 min-w-0 py-3 px-3 overflow-x-auto overflow-y-hidden scrollbar-thin">
            <div
              className="flex gap-5 h-full"
              style={{
                // Si hay pocas columnas, usar ancho completo; si no, scroll horizontal
                minWidth:
                  visibleColumnCount <= 4
                    ? "100%"
                    : `${visibleColumnCount * 320}px`,
              }}
            >
              {columns.map((column, colIndex) => {
                const isCompletedColumn = column.id === "COMPLETED";
                // Loading específico por tipo de columna
                const columnIsLoading = isCompletedColumn
                  ? isLoadingCompleted
                  : isLoadingLive;

                return (
                  <KanbanColumn
                    key={column.id}
                    status={column.id}
                    orders={filteredOrdersByStatus?.[column.id] || []}
                    onStatusChange={handleStatusChange}
                    onOrderClick={handleOrderClick}
                    isLoading={columnIsLoading}
                    viewMode={cardViewMode}
                    // Distribuir ancho igualitariamente entre columnas visibles
                    flexBasis={`calc((100% - ${(visibleColumnCount - 1) * 20}px) / ${visibleColumnCount})`}
                    minWidth={320}
                    // Infinite scroll props for COMPLETED column
                    isArchive={isCompletedColumn}
                    hasMore={isCompletedColumn ? hasNextPage : false}
                    isFetchingNextPage={
                      isCompletedColumn ? isFetchingNextPage : false
                    }
                    onLoadMore={isCompletedColumn ? fetchNextPage : undefined}
                    totalCount={metrics?.porEstadoOrden[column.id]}
                    // Tour step: mark the first card of the first column
                    firstCardTourStep={colIndex === 0 ? "order-card" : undefined}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Statistics - fuera del kanban */}
        <aside
          className={cn(
            "shrink-0 ml-0 transition-all duration-300 ease-in-out",
            "rounded-card-xl bg-white/30 backdrop-blur-xl border border-white/40",
            "flex flex-col overflow-hidden",
            isSidebarOpen
              ? "w-72 opacity-100 ml-3"
              : "w-0 opacity-0 border-0 ml-0"
          )}
        >
          {/* Scroll vertical solo en el sidebar */}
          <div className="w-72 p-4 overflow-y-auto flex-1 min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-pink-400" />
                <h3 className="font-semibold text-sm text-slate-700">
                  Operación en curso
                </h3>
              </div>
            </div>

            {/* Stats Content - Métricas de órdenes */}
            <div data-tour-step="metrics" className="space-y-6">
              {isLoadingLive ? <OrderMetricsSkeleton /> : <OrderMetrics />}
            </div>
          </div>
        </aside>
      </div>

      {/* Column Visibility Floating Bar */}
      <div data-tour-step="column-visibility">
        <ColumnVisibilityBar
          onVisibilityChange={setColumnVisibility}
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </div>

      {/* Dialog de detalle de orden - Solo renderizar cuando hay orderId seleccionado */}
      {selectedOrderId && (
        <OrderDetailDialog
          orderId={selectedOrderId}
          isOpen={isDetailOpen}
          onClose={handleCloseDetail}
        />
      )}
    </>
  );
}

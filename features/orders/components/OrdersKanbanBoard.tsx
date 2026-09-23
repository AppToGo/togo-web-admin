"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Minimize2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { KanbanColumn, RAIL_WIDTH } from "./KanbanColumn";
import { OrderDetailDialog } from "./OrderDetailDialog";
import { OrderMetrics, OrderMetricsSkeleton } from "./OrderMetrics";
import { FocusView } from "./FocusView";
import { GroupedListView } from "./GroupedListView";
import { HoverTooltip } from "./HoverTooltip";
import { StatsTickerRail } from "./StatsTickerRail";
import type { BoardViewMode } from "./OrderBoardToolbar";

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
  canCompleteOrder,
} from "../utils/order-status.utils";
import { formatOrderNumber } from "../utils/order-number.utils";
import type { CardDensity } from "./OrderCard";

// Gap between board columns — must match the container's `gap-3` (12px)
// class, since it's also part of each column's flexBasis calculation.
const COLUMN_GAP_PX = 12;
// Collapsed rail width — same value as RAIL_WIDTH in KanbanColumn, so every
// rail on the screen (columns + stats) has the same width.
const STATS_RAIL_WIDTH = "w-14";

interface OrdersKanbanBoardProps {
  searchQuery?: string;
  // Board view and card density — controlled from the page header (next to
  // the filters), not internal state.
  boardView?: BoardViewMode;
  density?: CardDensity;
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
    dineIn: boolean;
  };
}

function filterOrdersBySearch(
  orders: Order[] | undefined,
  query: string
): Order[] {
  if (!orders || !query.trim()) return orders || [];

  const lowerQuery = query.toLowerCase();
  return orders.filter((order) => {
    const orderNumber = formatOrderNumber(order.id, order.orderNumber).toLowerCase();
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
  boardView = "board",
  density = "regular",
  dateFrom,
  dateTo,
  businessId,
  branchIds,
  paymentStatusFilter = { paid: true, pending: true },
  deliveryTypeFilter = { delivery: true, pickup: true, dineIn: true },
}: OrdersKanbanBoardProps) {
  const t = useTranslations("orders");

  // Hydrate notification preferences when the orders page mounts
  useHydrateNotificationPreferences();

  // Get metrics for total counts per status
  const { data: metrics } = useOrderMetrics();

  // Estado local del sidebar de estadísticas
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // Stats panel collapsed to a narrow rail (inside the already open sidebar)
  // — independent from the isSidebarOpen/ColumnVisibilityBar cookie.
  const [statsRailCollapsed, setStatsRailCollapsed] = useState(false);

  // Columns collapsed to a rail in the Board view — Delivered and Cancelled
  // start collapsed (the least checked during day-to-day operation).
  const [collapsedColumns, setCollapsedColumns] = useState<
    Partial<Record<OrderStatus, boolean>>
  >({ COMPLETED: true, CANCELLED: true });
  const handleColumnCollapsedChange = useCallback(
    (status: OrderStatus, collapsed: boolean) => {
      setCollapsedColumns((prev) => ({ ...prev, [status]: collapsed }));
    },
    []
  );

  // Active status in the "By status" (Focus) view
  const [focusStatusOverride, setFocusStatusOverride] = useState<OrderStatus | null>(null);

  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityConfig>({
      CONFIRMED: true,
      IN_PROGRESS: true,
      READY: true,
      COMPLETED: true,
      CANCELLED: false,
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

  // How many visible columns are collapsed to a rail. Collapsed ones already
  // have a fixed width (RAIL_WIDTH) inside KanbanColumn, so the percentage
  // split among the EXPANDED ones must subtract them — otherwise those
  // columns (and their cards) render narrower than they should.
  const collapsedVisibleCount = columns.filter((c) => collapsedColumns[c.id]).length;
  const expandedColumnCount = Math.max(visibleColumnCount - collapsedVisibleCount, 1);

  // Active status for the "By status" view: the user's pick while it's still
  // a visible column, otherwise the first available one.
  const activeFocusStatus: OrderStatus | undefined =
    focusStatusOverride && columns.some((c) => c.id === focusStatusOverride)
      ? focusStatusOverride
      : columns[0]?.id;

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

      // Filtro por tipo de envío (docs/architecture/pedidos-en-mesa.md,
      // Fase 1: antes era binario delivery/pickup y clasificaba todo
      // pedido DINE_IN como "pickup" — ahora las 3 modalidades son
      // explícitas).
      if (
        !deliveryTypeFilter.delivery ||
        !deliveryTypeFilter.pickup ||
        !deliveryTypeFilter.dineIn
      ) {
        result = result.filter((order) => {
          if (order.deliveryType === "DINE_IN") return deliveryTypeFilter.dineIn;
          // Usar deliveryType si está disponible, sino usar addressId como fallback
          const isDelivery = order.deliveryType
            ? order.deliveryType === "DELIVERY"
            : !!order.addressId;
          return isDelivery ? deliveryTypeFilter.delivery : deliveryTypeFilter.pickup;
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

  // Active orders (for the collapsed stats rail: count and "oldest"), the
  // same statuses the card timer highlights.
  const activeOrdersFlat = useMemo(
    () =>
      (["CONFIRMED", "IN_PROGRESS", "READY"] as OrderStatus[]).flatMap(
        (status) => filteredOrdersByStatus[status] || []
      ),
    [filteredOrdersByStatus]
  );

  // Single entry point for every status change on this screen (drag & drop,
  // "Move to" menu, next-step button, "By status" tab drops). Moving to
  // Delivered runs the same canCompleteOrder check as the detail status
  // editor, so no view can complete an unpaid or not-ready order.
  const handleStatusChange = useCallback(
    (orderId: string, newStatus: string) => {
      if (newStatus === "COMPLETED") {
        const order = Object.values(filteredOrdersByStatus)
          .flat()
          .find((o) => o.id === orderId);
        const validation = order ? canCompleteOrder(order) : { valid: true };
        if (!validation.valid) {
          toast.error(
            validation.message
              ? t(validation.message.replace(/^orders\./, ""))
              : t("errors.cannotComplete")
          );
          return;
        }
      }
      updateStatus.mutate({
        orderId,
        data: { status: newStatus as OrderStatus },
      });
    },
    [updateStatus, filteredOrdersByStatus, t]
  );

  // Delivered orders come from a separate paginated query; every view uses
  // the same loading flag and "load more" for that status as the board.
  const isStatusLoading = useCallback(
    (status: OrderStatus) => (status === "COMPLETED" ? isLoadingCompleted : isLoadingLive),
    [isLoadingCompleted, isLoadingLive]
  );
  const archivePagination = useMemo(
    () => ({
      status: "COMPLETED" as OrderStatus,
      hasMore: !!hasNextPage,
      isFetchingNextPage,
      onLoadMore: () => {
        fetchNextPage();
      },
    }),
    [hasNextPage, isFetchingNextPage, fetchNextPage]
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
          {boardView === "board" && (
            /* Horizontal scroll only here */
            <div className="flex-1 min-w-0 py-3 px-3 overflow-x-auto overflow-y-hidden scrollbar-thin">
              <div
                className="flex gap-3 h-full"
                style={{
                  // With few EXPANDED columns use the full width; otherwise
                  // scroll horizontally. Rails barely take space
                  // (RAIL_WIDTH), so they don't count as a full 320px column.
                  minWidth:
                    expandedColumnCount <= 4
                      ? "100%"
                      : `${expandedColumnCount * 320 + collapsedVisibleCount * RAIL_WIDTH}px`,
                }}
              >
                {columns.map((column, colIndex) => {
                  const isCompletedColumn = column.id === "COMPLETED";
                  // Per-column loading state
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
                      density={density}
                      collapsed={!!collapsedColumns[column.id]}
                      onCollapsedChange={(collapsed) =>
                        handleColumnCollapsedChange(column.id, collapsed)
                      }
                      // Split the width evenly among EXPANDED columns,
                      // subtracting the rails' fixed space (rails ignore
                      // flexBasis and use their own fixed width).
                      flexBasis={`calc((100% - ${(visibleColumnCount - 1) * COLUMN_GAP_PX}px - ${collapsedVisibleCount * RAIL_WIDTH}px) / ${expandedColumnCount})`}
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
          )}

          {boardView === "focus" && activeFocusStatus && (
            <div className="flex-1 min-h-0 p-3">
              <FocusView
                statuses={columns.map((c) => c.id)}
                ordersByStatus={filteredOrdersByStatus}
                activeStatus={activeFocusStatus}
                onActiveStatusChange={setFocusStatusOverride}
                onOrderClick={handleOrderClick}
                onStatusChange={handleStatusChange}
                density={density}
                totalCounts={metrics?.porEstadoOrden}
                isStatusLoading={isStatusLoading}
                archive={archivePagination}
                firstCardTourStep="order-card"
              />
            </div>
          )}

          {boardView === "list" && (
            <div className="flex-1 min-h-0 p-3">
              <GroupedListView
                statuses={columns.map((c) => c.id)}
                ordersByStatus={filteredOrdersByStatus}
                onOrderClick={handleOrderClick}
                onStatusChange={handleStatusChange}
                isStatusLoading={isStatusLoading}
                archive={archivePagination}
                firstRowTourStep="order-card"
              />
            </div>
          )}
        </div>

        {/* Right Sidebar - Statistics - fuera del kanban */}
        <aside
          className={cn(
            "shrink-0 ml-0 transition-all duration-300 ease-in-out",
            "rounded-card-xl overflow-hidden flex flex-col",
            !isSidebarOpen && "w-0 opacity-0 border-0 ml-0",
            isSidebarOpen &&
              !statsRailCollapsed &&
              "w-72 opacity-100 ml-3 bg-white/30 backdrop-blur-xl border border-white/40",
            isSidebarOpen && statsRailCollapsed && cn(STATS_RAIL_WIDTH, "opacity-100 ml-3")
          )}
        >
          {statsRailCollapsed ? (
            // Collapsed rail: a single button (animated ticker), like a
            // collapsed column rail — no separate expand icon.
            <StatsTickerRail
              metrics={metrics}
              activeOrders={activeOrdersFlat}
              onExpand={() => setStatsRailCollapsed(false)}
            />
          ) : (
            <div className="w-72 p-4 overflow-y-auto flex-1 min-h-0 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-pink-400 shrink-0" />
                  <h3 className="font-semibold text-sm text-slate-700">
                    Operación en curso
                  </h3>
                </div>
                <HoverTooltip content={t("actions.collapseStats")} side="left">
                  <button
                    type="button"
                    aria-label={t("actions.collapseStats")}
                    onClick={() => setStatsRailCollapsed(true)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white/70 transition-colors shrink-0"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                </HoverTooltip>
              </div>

              {/* Stats content - order metrics */}
              <div data-tour-step="metrics" className="flex-1 min-h-0">
                <div className="space-y-6">
                  {isLoadingLive ? <OrderMetricsSkeleton /> : <OrderMetrics />}
                </div>
              </div>
            </div>
          )}
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

      {/* Order detail as a side panel - only rendered when an order is selected */}
      {selectedOrderId && (
        <OrderDetailDialog
          orderId={selectedOrderId}
          isOpen={isDetailOpen}
          onClose={handleCloseDetail}
          variant="drawer"
        />
      )}
    </>
  );
}

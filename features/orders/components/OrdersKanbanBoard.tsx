"use client";

import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { KanbanColumn } from "./KanbanColumn";
import { OrderMetrics, OrderMetricsSkeleton } from "./OrderMetrics";
import { RecentActivity, RecentActivitySkeleton } from "./RecentActivity";
import { OrderDetail } from "./OrderDetail";

import {
  ColumnVisibilityBar,
  type ColumnVisibilityConfig,
} from "./ColumnVisibilityBar";

import { useOrdersByStatus, useUpdateOrderStatus } from "../hooks/useOrders";
import type { Order, OrderStatus } from "../types";
import {
  getKanbanColumns,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getDeliveryTypeLabel,
} from "../utils/order-status.utils";
import type { CardViewMode } from "./OrderCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OrdersKanbanBoardProps {
  searchQuery?: string;
  cardViewMode?: CardViewMode;
  dateFrom?: string;
  dateTo?: string;
  businessId?: string; // Para SUPER_ADMIN
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
    const paymentMethodLabel = getPaymentMethodLabel(order.paymentMethod)
      .toLowerCase();
    const paymentStatusLabel = getPaymentStatusLabel(order.paymentStatus)
      .toLowerCase();
    const deliveryTypeLabel = getDeliveryTypeLabel(order.deliveryType)
      .toLowerCase();

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
  paymentStatusFilter = { paid: true, pending: true },
  deliveryTypeFilter = { delivery: true, pickup: true },
}: OrdersKanbanBoardProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityConfig>({
      CONFIRMED: true,
      IN_PROGRESS: true,
      ON_THE_WAY: true,
      COMPLETED: true,
    });
  // Estado para el dialog de detalle (un solo dialog para todas las órdenes)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const isDetailOpen = !!selectedOrderId;
  
  const { orders, ordersByStatus, isLoading, error } = useOrdersByStatus({
    dateFrom,
    dateTo,
    businessId,
  });
  const updateStatus = useUpdateOrderStatus();

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
    if (!ordersByStatus) return ordersByStatus;

    const filtered: Record<OrderStatus, Order[]> = {} as any;
    Object.entries(ordersByStatus).forEach(([status, statusOrders]) => {
      let result = statusOrders;

      // Filtro por búsqueda
      if (searchQuery.trim()) {
        result = filterOrdersBySearch(result, searchQuery);
      }

      // Filtro por estado de pago
      if (!paymentStatusFilter.paid || !paymentStatusFilter.pending) {
        result = result.filter((order) => {
          if (order.paymentStatus === "PAID" && !paymentStatusFilter.paid) return false;
          if (order.paymentStatus === "PENDING" && !paymentStatusFilter.pending) return false;
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
  }, [ordersByStatus, searchQuery, paymentStatusFilter, deliveryTypeFilter]);

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
      <div
        className={cn(
          "relative rounded-card-xl flex flex-row min-h-0 flex-1",
          "bg-white/30 backdrop-blur-xl border border-white/40"
        )}
      >
        {/* Main Kanban Area */}
        <div
          className={cn(
            "flex-1 min-w-0 py-3 pl-3 flex flex-col min-h-0 transition-all duration-300 pr-3"
          )}
        >
          {/* Kanban Columns - Container adaptativo */}
          <div className="overflow-x-auto pb-4 flex-1 min-h-0 scrollbar-thin">
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
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  status={column.id}
                  orders={filteredOrdersByStatus?.[column.id] || []}
                  onStatusChange={handleStatusChange}
                  onOrderClick={handleOrderClick}
                  isLoading={isLoading}
                  viewMode={cardViewMode}
                  // Distribuir ancho igualitariamente entre columnas visibles
                  flexBasis={`calc((100% - ${(visibleColumnCount - 1) * 20}px) / ${visibleColumnCount})`}
                  minWidth={320}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Statistics */}
        <div
          className={cn(
            "shrink-0 transition-all duration-300 ease-in-out border-l border-white/40 overflow-hidden",
            isSidebarOpen ? "w-72 opacity-100" : "w-0 opacity-0 border-l-0"
          )}
        >
          {/* Inner container with fixed width to prevent content squishing during animation */}
          <div className="w-72 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-pink-400" />
                <h3 className="font-semibold text-sm text-slate-700">
                  Operación en curso
                </h3>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-white/70 px-2 py-0.5 rounded-full">
                {orders?.length || 0}
              </span>
            </div>

            {/* Stats Content */}
            <div className="space-y-4">
              {isLoading ? <OrderMetricsSkeleton /> : <OrderMetrics />}
              {isLoading ? <RecentActivitySkeleton /> : <RecentActivity />}
            </div>
          </div>
        </div>
      </div>

      {/* Column Visibility Floating Bar */}
      <ColumnVisibilityBar
        onVisibilityChange={setColumnVisibility}
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Dialog de detalle de orden - Un solo dialog para todas las órdenes */}
      <Dialog open={isDetailOpen} onOpenChange={(open) => !open && handleCloseDetail()}>
        <DialogContent className="bg-white/95 backdrop-blur-lg sm:max-w-lg p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Detalle de Orden
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            {selectedOrderId && (
              <OrderDetail
                orderId={selectedOrderId}
                onClose={handleCloseDetail}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

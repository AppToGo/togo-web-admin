"use client";

import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { KanbanColumn } from "./KanbanColumn";
import { OrderMetrics, OrderMetricsSkeleton } from "./OrderMetrics";
import { RecentActivity, RecentActivitySkeleton } from "./RecentActivity";
import { useOrdersByStatus, useUpdateOrderStatus } from "../hooks/useOrders";
import type { Order, OrderStatus } from "../types";
import { getKanbanColumns } from "../utils/order-status.utils";
import { kanbanColumnVariants, columnHeaderColorVariants } from "../styles";
import type { CardViewMode } from "./OrderCard";

interface OrdersKanbanBoardProps {
  searchQuery?: string;
  cardViewMode?: CardViewMode;
}

function formatOrderNumber(id: string): string {
  return `#${id.slice(0, 6).toUpperCase()}`;
}

function filterOrdersBySearch(orders: Order[] | undefined, query: string): Order[] {
  if (!orders || !query.trim()) return orders || [];
  
  const lowerQuery = query.toLowerCase();
  return orders.filter((order) => {
    const orderNumber = formatOrderNumber(order.id).toLowerCase();
    const customerName = order.customer?.name?.toLowerCase() || "";
    const productNames = order.items?.map((i) => i.productName.toLowerCase()).join(" ") || "";
    
    return (
      orderNumber.includes(lowerQuery) ||
      customerName.includes(lowerQuery) ||
      productNames.includes(lowerQuery)
    );
  });
}

export function OrdersKanbanBoard({ searchQuery = "", cardViewMode = "card" }: OrdersKanbanBoardProps) {
  const { orders, ordersByStatus, isLoading, error } = useOrdersByStatus();
  const updateStatus = useUpdateOrderStatus();

  const columns = useMemo(() => getKanbanColumns(), []);
  
  // Filtrar órdenes por búsqueda
  const filteredOrdersByStatus = useMemo(() => {
    if (!ordersByStatus || !searchQuery.trim()) return ordersByStatus;
    
    const filtered: Record<OrderStatus, Order[]> = {} as any;
    Object.entries(ordersByStatus).forEach(([status, statusOrders]) => {
      filtered[status as OrderStatus] = filterOrdersBySearch(statusOrders, searchQuery);
    });
    return filtered;
  }, [ordersByStatus, searchQuery]);

  const handleStatusChange = useCallback(
    (orderId: string, newStatus: string) => {
      updateStatus.mutate({
        orderId,
        data: { status: newStatus as OrderStatus },
      });
    },
    [updateStatus]
  );

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
    <div
      className={cn(
        "rounded-card-xl flex flex-col",
        "bg-white/30 backdrop-blur-xl border border-white/40"
      )}
    >
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        {/* Main Kanban Area */}
        <div className="flex-1 min-w-0 py-3 pl-3 pr-0 flex flex-col min-h-0">
          {/* Kanban Columns */}
          <div className="overflow-x-auto pb-4 pr-3 flex-1 min-h-0">
            <div className="flex gap-5 min-w-max h-full">
              {columns.map((column, index) => {
                const headerColors = [
                  { color: "gray" as const, dot: "bg-gray-400" },
                  { color: "blue" as const, dot: "bg-blue-400" },
                  { color: "purple" as const, dot: "bg-purple-400" },
                  { color: "green" as const, dot: "bg-emerald-400" },
                  { color: "pink" as const, dot: "bg-pink-400" },
                ];
                const headerStyle = headerColors[index % headerColors.length];

                return (
                  <KanbanColumn
                    key={column.id}
                    status={column.id}
                    title={column.title}
                    orders={filteredOrdersByStatus?.[column.id] || []}
                    onStatusChange={handleStatusChange}
                    isLoading={isLoading}
                    headerColor={headerStyle.color}
                    dotColor={headerStyle.dot}
                    viewMode={cardViewMode}
                  />
                );
              })}
              <div
                className={cn(
                  kanbanColumnVariants({ background: "default" }),
                  "h-[calc(100vh-200px)]"
                )}
              >
                {/* Header de la columna */}
                <div className={columnHeaderColorVariants({ color: "pink" })}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-pink-400`} />
                      <h3 className="font-semibold text-sm text-slate-700">
                        Operación en curso
                      </h3>
                    </div>
                    <span className="text-xs font-medium text-slate-500 bg-white/70 px-2 py-0.5 rounded-full">
                      {orders?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Contenedor de tarjetas */}
                <div>
                  {isLoading ? <OrderMetricsSkeleton /> : <OrderMetrics />}
                  {isLoading ? <RecentActivitySkeleton /> : <RecentActivity />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar separator */}
        {/* <div className="hidden lg:block w-px bg-linear-to-b from-transparent via-slate-200 to-transparent" /> */}

        {/* Right Sidebar */}
        {/* <div className="w-full lg:w-60 shrink-0 p-6 space-y-6 bg-white rounded-tr-4xl rounded-br-4xl">
          {isLoading ? <OrderMetricsSkeleton /> : <OrderMetrics />}
          {isLoading ? <RecentActivitySkeleton /> : <RecentActivity />}
        </div> */}
      </div>
    </div>
  );
}

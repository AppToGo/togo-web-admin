"use client";

import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { KanbanColumn } from "./KanbanColumn";
import { OrderMetrics, OrderMetricsSkeleton } from "./OrderMetrics";
import { RecentActivity, RecentActivitySkeleton } from "./RecentActivity";
import { useOrdersByStatus, useUpdateOrderStatus } from "../hooks/useOrders";
import type { OrderStatus } from "../types";
import { getKanbanColumns } from "../utils/order-status.utils";
import { mainContainerVariants } from "../styles";

export function OrdersKanbanBoard() {
  const { ordersByStatus, isLoading, error } = useOrdersByStatus();
  const updateStatus = useUpdateOrderStatus();

  const columns = useMemo(() => getKanbanColumns(), []);

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
    <div className={mainContainerVariants({ variant: "default" })}>
      <div className="flex flex-col lg:flex-row">
        {/* Main Kanban Area */}
        <div className="flex-1 min-w-0 p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Gestión de Órdenes
            </h2>
            <p className="text-slate-500 mt-1">
              Arrastra órdenes entre columnas para cambiar su estado
            </p>
          </div>

          {/* Kanban Columns */}
          <div className="overflow-x-auto pb-4 -mx-6 px-6">
            <div className="flex gap-5 min-w-max">
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
                    orders={ordersByStatus?.[column.id] || []}
                    onStatusChange={handleStatusChange}
                    isLoading={isLoading}
                    headerColor={headerStyle.color}
                    dotColor={headerStyle.dot}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar separator */}
        <div className="hidden lg:block w-px bg-linear-to-b from-transparent via-slate-200 to-transparent" />

        {/* Right Sidebar */}
        <div className="w-full lg:w-80 shrink-0 p-6 space-y-6 glass-light">
          {isLoading ? <OrderMetricsSkeleton /> : <OrderMetrics />}
          {isLoading ? <RecentActivitySkeleton /> : <RecentActivity />}
        </div>
      </div>
    </div>
  );
}

"use client";

import { memo } from "react";
import { OrderCard } from "./OrderCard";
import type { Order, OrderStatus } from "../types";
import { STATUS_LABELS } from "../utils/order-status.utils";
import { kanbanColumnVariants, columnHeaderColorVariants } from "../styles";

interface KanbanColumnProps {
  status: OrderStatus;
  title: string;
  orders: Order[];
  onStatusChange?: (orderId: string, newStatus: string) => void;
  isLoading?: boolean;
  headerColor?:
    | "gray"
    | "blue"
    | "purple"
    | "green"
    | "orange"
    | "pink"
    | "amber"
    | "cyan"
    | "indigo";
  dotColor?: string;
}

export const KanbanColumn = memo(function KanbanColumn({
  status,
  title,
  orders,
  onStatusChange,
  isLoading,
  headerColor = "gray",
  dotColor = "bg-gray-400",
}: KanbanColumnProps) {
  return (
    <div className={kanbanColumnVariants({ background: "default" })}>
      {/* Header de la columna */}
      <div className={columnHeaderColorVariants({ color: headerColor })}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${dotColor}`} />
            <h3 className="font-semibold text-sm text-slate-700">{title}</h3>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-white/70 px-2 py-0.5 rounded-full">
            {orders.length}
          </span>
        </div>
      </div>

      {/* Contenedor de tarjetas */}
      <div className="flex-1 overflow-y-auto space-y-3 max-h-[calc(100vh-340px)] scrollbar-thin">
        {isLoading ? (
          <>
            <KanbanCardSkeleton />
            <KanbanCardSkeleton />
            <KanbanCardSkeleton />
          </>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-card bg-slate-100 flex items-center justify-center mb-3">
              <div className={`w-4 h-4 rounded-full ${dotColor} opacity-30`} />
            </div>
            <p className="text-sm text-slate-400">Sin órdenes</p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={onStatusChange}
              badgeVariant={getBadgeVariant(status)}
            />
          ))
        )}
      </div>

      {/* Botón Add Card */}
      <button className="mt-3 w-full py-3 text-sm text-slate-500 hover:text-slate-700 hover:bg-white/60 rounded-card transition-colors flex items-center justify-center gap-1">
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add Card
      </button>
    </div>
  );
});

function getBadgeVariant(status: OrderStatus): string {
  const variants: Record<string, string> = {
    CONFIRMED: "blue",
    IN_PROGRESS: "purple",
    READY: "green",
    ON_THE_WAY: "orange",
    COMPLETED: "pink",
  };
  return variants[status] || "slate";
}

function KanbanCardSkeleton() {
  return (
    <div className="bg-white rounded-card border border-slate-100 p-4 space-y-3 shadow-card animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-20 bg-slate-100 rounded-full" />
        <div className="h-4 w-4 bg-slate-100 rounded" />
      </div>
      <div className="h-4 w-3/4 bg-slate-100 rounded" />
      <div className="h-3 w-1/2 bg-slate-100 rounded" />
      <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
        <div className="flex gap-2">
          <div className="h-3 w-12 bg-slate-100 rounded" />
          <div className="h-3 w-8 bg-slate-100 rounded" />
        </div>
        <div className="h-6 w-6 bg-slate-100 rounded-full" />
      </div>
    </div>
  );
}

"use client";

import { memo, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
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

// Mapa de colores para drag over según el headerColor
const dragOverColors: Record<string, { ring: string; bg: string; border: string; text: string; lightBg: string; dot: string }> = {
  gray: { ring: "ring-gray-400", bg: "bg-gray-50/30", border: "border-gray-300", text: "text-gray-600", lightBg: "bg-gray-100/30", dot: "bg-gray-400" },
  blue: { ring: "ring-blue-400", bg: "bg-blue-50/30", border: "border-blue-300", text: "text-blue-600", lightBg: "bg-blue-100/30", dot: "bg-blue-400" },
  purple: { ring: "ring-purple-400", bg: "bg-purple-50/30", border: "border-purple-300", text: "text-purple-600", lightBg: "bg-purple-100/30", dot: "bg-purple-400" },
  green: { ring: "ring-emerald-400", bg: "bg-emerald-50/30", border: "border-emerald-300", text: "text-emerald-600", lightBg: "bg-emerald-100/30", dot: "bg-emerald-400" },
  orange: { ring: "ring-orange-400", bg: "bg-orange-50/30", border: "border-orange-300", text: "text-orange-600", lightBg: "bg-orange-100/30", dot: "bg-orange-400" },
  pink: { ring: "ring-pink-400", bg: "bg-pink-50/30", border: "border-pink-300", text: "text-pink-600", lightBg: "bg-pink-100/30", dot: "bg-pink-400" },
  amber: { ring: "ring-amber-400", bg: "bg-amber-50/30", border: "border-amber-300", text: "text-amber-600", lightBg: "bg-amber-100/30", dot: "bg-amber-400" },
  cyan: { ring: "ring-cyan-400", bg: "bg-cyan-50/30", border: "border-cyan-300", text: "text-cyan-600", lightBg: "bg-cyan-100/30", dot: "bg-cyan-400" },
  indigo: { ring: "ring-indigo-400", bg: "bg-indigo-50/30", border: "border-indigo-300", text: "text-indigo-600", lightBg: "bg-indigo-100/30", dot: "bg-indigo-400" },
};

export const KanbanColumn = memo(function KanbanColumn({
  status,
  title,
  orders,
  onStatusChange,
  isLoading,
  headerColor = "gray",
  dotColor = "bg-gray-400",
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Obtener colores para drag over según el headerColor
  const colors = dragOverColors[headerColor] || dragOverColors.gray;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const orderId = e.dataTransfer.getData("orderId");
    const fromStatus = e.dataTransfer.getData("fromStatus");
    
    if (orderId && fromStatus !== status) {
      // Llamar al callback para cambiar el estado
      onStatusChange?.(orderId, status);
    }
  }, [status, onStatusChange]);

  return (
    <div 
      className={cn(
        kanbanColumnVariants({ background: "default" }), 
        "h-[calc(100vh-200px)] transition-all duration-200",
        isDragOver && `ring-2 ${colors.ring} ring-offset-2 ${colors.bg}`
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header de la columna */}
      <div className={columnHeaderColorVariants({ color: headerColor })}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${dotColor}`} />
            <h3 className="font-semibold text-sm text-slate-700">{title}</h3>
          </div>
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full transition-colors",
            isDragOver 
              ? `${colors.lightBg} ${colors.text}` 
              : "bg-white/70 text-slate-500"
          )}>
            {orders.length}
          </span>
        </div>
      </div>

      {/* Contenedor de tarjetas */}
      <div className={cn(
        "flex-1 overflow-y-auto space-y-3 min-h-0 scrollbar-thin transition-colors duration-200 rounded-lg p-1",
        isDragOver && colors.lightBg
      )}>
        {isLoading ? (
          <>
            <KanbanCardSkeleton />
            <KanbanCardSkeleton />
            <KanbanCardSkeleton />
          </>
        ) : orders.length === 0 ? (
          <div className={cn(
            "flex flex-col items-center justify-center py-8 text-center rounded-card transition-colors duration-200 border-2 border-dashed",
            isDragOver 
              ? `border-${headerColor}-300 bg-${headerColor}-50/50` 
              : "border-slate-200"
          )}>
            <div className={cn(
              "w-12 h-12 rounded-card flex items-center justify-center mb-3 transition-colors",
              isDragOver ? colors.lightBg.replace('/30', '') : "bg-slate-100"
            )}>
              <div className={cn(
                "w-4 h-4 rounded-full transition-colors",
                isDragOver ? colors.dot : `${dotColor} opacity-30`
              )} />
            </div>
            <p className={cn(
              "text-sm transition-colors",
              isDragOver ? `${colors.text} font-medium` : "text-slate-400"
            )}>
              {isDragOver ? "Suelta aquí" : "Sin órdenes"}
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={onStatusChange}
              badgeVariant={getBadgeVariant(status)}
              currentStatus={status}
              dragColor={headerColor}
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

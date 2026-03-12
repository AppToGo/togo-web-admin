"use client";

import { memo } from "react";
import { TrendingUp } from "lucide-react";
import { useOrderMetrics } from "../hooks/useOrders";
import { formatCurrency } from "../utils/order-status.utils";
import {
  progressBarVariants,
  progressBarFillVariants,
} from "../styles";
import { Skeleton } from "@/components/ui/skeleton";

export const OrderMetrics = memo(function OrderMetrics() {
  const metrics = useOrderMetrics();

  const progressItems = [
    {
      label: "Confirmadas",
      count: metrics.ordersByStatus.CONFIRMED,
      variant: "blue" as const,
    },
    {
      label: "En proceso",
      count: metrics.ordersByStatus.IN_PROGRESS,
      variant: "purple" as const,
    },
    {
      label: "Listas",
      count: metrics.ordersByStatus.READY,
      variant: "amber" as const,
    },
    {
      label: "En camino",
      count: metrics.ordersByStatus.ON_THE_WAY,
      variant: "cyan" as const,
    },
    {
      label: "Completadas",
      count: metrics.ordersByStatus.COMPLETED,
      variant: "emerald" as const,
    },
  ].filter(item => item.count > 0);

  // Calcular el máximo para la barra de progreso proporcional
  const maxCount = Math.max(...progressItems.map((item) => item.count), 1);

  return (
    <div className="space-y-6">
      {/* Progress Bars - Estados del Kanban */}
      <div className="space-y-3">
        {progressItems.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-600">{item.label}</span>
              <span className="text-sm font-medium text-slate-700">
                {item.count}
              </span>
            </div>
            <div className={progressBarVariants({ size: "default" })}>
              <div
                className={progressBarFillVariants({ variant: item.variant })}
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Card - Ingresos detallados */}
      <div className="bg-gradient-indigo-purple rounded-card-lg p-5 text-white">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-icon bg-white/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white/80">
            Ingresos
          </span>
        </div>
        
        {/* Subtotal */}
        <p className="text-xl font-semibold">
          {formatCurrency(metrics.subtotalRevenue)}
        </p>
        
        {/* Delivery Fee */}
        <p className="text-sm text-white/70 mt-1">
          + {formatCurrency(metrics.deliveryRevenue)} domicilio
        </p>
        
        {/* Divider */}
        <div className="border-t border-white/30 my-3" />
        
        {/* Total destacado */}
        <p className="text-3xl font-bold">
          {formatCurrency(metrics.totalRevenue)}
        </p>
        <p className="text-xs text-white/60 font-medium uppercase tracking-wide mt-1">
          Total
        </p>
        
        {/* Conteo de órdenes */}
        <p className="text-xs text-white/60 mt-3">
          {metrics.paidOrdersCount} órdenes pagadas
        </p>
      </div>
    </div>
  );
});

export function OrderMetricsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-28" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <div className="flex justify-between mb-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-10" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-32 w-full rounded-card-lg" />
    </div>
  );
}

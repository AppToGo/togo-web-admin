"use client";

import { memo } from "react";
import { useDashboardMetrics } from "../hooks/useOrderMetrics";
import { formatCurrency } from "../utils/order-status.utils";
import {
  progressBarVariants,
  progressBarFillVariants,
} from "../styles";
import { Skeleton } from "@/components/ui/skeleton";

export const OrderMetrics = memo(function OrderMetrics() {
  const { raw: metrics, isLoading } = useDashboardMetrics();

  // Mostrar skeleton mientras carga
  if (isLoading || !metrics) {
    return <OrderMetricsSkeleton />;
  }

  // Datos por estado para las barras de progreso (del endpoint /metrics)
  // Usamos los conteos del backend para mantener consistencia con el backend
  const progressItems = [
    {
      label: "Confirmadas",
      count: metrics.porEstadoOrden.CONFIRMED || 0,
      variant: "blue" as const,
    },
    {
      label: "En proceso",
      count: metrics.porEstadoOrden.IN_PROGRESS || 0,
      variant: "purple" as const,
    },
    {
      label: "Listas",
      count: metrics.porEstadoOrden.READY || 0,
      variant: "amber" as const,
    },
    {
      label: "En camino",
      count: metrics.porEstadoOrden.ON_THE_WAY || 0,
      variant: "cyan" as const,
    },
    {
      label: "Completadas",
      count: metrics.porEstadoOrden.COMPLETED || 0,
      variant: "emerald" as const,
    },
  ].filter(item => item.count > 0);

  // Total de órdenes en los estados mostrados
  const totalOrdersInProgress = progressItems.reduce((sum, item) => sum + item.count, 0);

  // Usar el total como referencia para las barras (para mostrar proporción real)
  const maxCount = totalOrdersInProgress > 0 ? totalOrdersInProgress : 1;

  return (
    <div className="space-y-6">
      {/* Progress Bars - Estados del Kanban */}
      <div className="space-y-3">
        {/* Header con total */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Estados
          </span>
          <span className="text-xs text-slate-500">
            {totalOrdersInProgress} {totalOrdersInProgress === 1 ? "orden" : "órdenes"}
          </span>
        </div>

        {progressItems.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-600">{item.label}</span>
              <span className="text-sm font-medium text-slate-700">
                {item.count} 
                <span className="text-slate-400 font-normal"> / {totalOrdersInProgress}</span>
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
        {progressItems.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">
            No hay órdenes en proceso
          </p>
        )}
      </div>

      {/* Revenue Card - Ingresos detallados */}
      <div className="bg-gradient-indigo-purple rounded-card-lg p-5 text-white">
        {/* Pagado */}
        <div className="mb-4">
          <p className="text-xs text-white/60 font-medium uppercase tracking-wide mb-1">
            Pagado
          </p>
          <p className="text-2xl font-bold">
            {formatCurrency(metrics.recaudos.pagadas.total)}
          </p>
          <p className="text-xs text-white/50 mt-0.5">
            {metrics.conteos.pagadas} {metrics.conteos.pagadas === 1 ? "orden" : "órdenes"}
          </p>
        </div>

        {/* Separador */}
        <div className="border-t border-white/20 my-3" />

        {/* Pendiente de pago */}
        <div>
          <p className="text-xs text-white/60 font-medium uppercase tracking-wide mb-1">
            Pendiente de pago
          </p>
          <p className="text-xl font-semibold text-white/90">
            {formatCurrency(metrics.recaudos.pendientesPago.total)}
          </p>
          <p className="text-xs text-white/50 mt-0.5">
            {metrics.conteos.pendientesPago} {metrics.conteos.pendientesPago === 1 ? "orden" : "órdenes"}
          </p>
        </div>
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

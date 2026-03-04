"use client";

import { memo } from "react";
import { TrendingUp } from "lucide-react";
import { useOrderMetrics } from "../hooks/useOrders";
import { formatCurrency } from "../utils/order-status.utils";
import {
  metricsCardVariants,
  progressBarVariants,
  progressBarFillVariants,
} from "../styles";
import { Skeleton } from "@/components/ui/skeleton";

export const OrderMetrics = memo(function OrderMetrics() {
  const metrics = useOrderMetrics();

  const progressItems = [
    {
      label: "Copywriting",
      current: 3,
      total: 8,
      variant: "purple" as const,
    },
    {
      label: "Illustrations",
      current: 6,
      total: 10,
      variant: "green" as const,
    },
    {
      label: "UI Design",
      current: 2,
      total: 7,
      variant: "blue" as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <h3 className="font-semibold text-slate-900 text-base">Task Progress</h3>

      {/* Progress Bars */}
      <div className="space-y-4">
        {progressItems.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-slate-600">{item.label}</span>
              <span className="text-sm text-slate-500">
                {item.current}/{item.total}
              </span>
            </div>
            <div className={progressBarVariants({ size: "default" })}>
              <div
                className={progressBarFillVariants({ variant: item.variant })}
                style={{ width: `${(item.current / item.total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Card */}
      <div className="bg-gradient-indigo-purple rounded-card-lg p-5 text-white">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-icon bg-white/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white/80">
            Ingresos hoy
          </span>
        </div>
        <p className="text-2xl font-bold">
          {formatCurrency(metrics.totalRevenue)}
        </p>
        <p className="text-xs text-white/60 mt-1">
          {metrics.completedToday} órdenes completadas
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

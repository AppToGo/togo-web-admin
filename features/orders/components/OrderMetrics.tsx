"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { useDashboardMetrics } from "../hooks/useOrderMetrics";
import { formatCurrency } from "../utils/order-status.utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressBar, MetricCard } from "@/shared/components/metrics";

export const OrderMetrics = memo(function OrderMetrics() {
  const { raw: metrics, isLoading } = useDashboardMetrics();
  const t = useTranslations("orders");

  // Show skeleton while loading
  if (isLoading || !metrics) {
    return <OrderMetricsSkeleton />;
  }

  // Data by status for progress bars (from /metrics endpoint)
  // We use backend counts to maintain consistency
  const progressItems = [
    {
      label: t("status.CONFIRMED"),
      count: metrics.porEstadoOrden.CONFIRMED || 0,
      color: "blue" as const,
    },
    {
      label: t("status.IN_PROGRESS"),
      count: metrics.porEstadoOrden.IN_PROGRESS || 0,
      color: "purple" as const,
    },
    {
      label: t("status.READY"),
      count: metrics.porEstadoOrden.READY || 0,
      color: "amber" as const,
    },
    {
      label: t("status.ON_THE_WAY"),
      count: metrics.porEstadoOrden.ON_THE_WAY || 0,
      color: "cyan" as const,
    },
    {
      label: t("status.COMPLETED"),
      count: metrics.porEstadoOrden.COMPLETED || 0,
      color: "emerald" as const,
    },
  ].filter((item) => item.count > 0);

  // Total orders in displayed statuses
  const totalOrdersInProgress = progressItems.reduce(
    (sum, item) => sum + item.count,
    0
  );

  // Use total as reference for bars (to show real proportion)
  const maxCount = totalOrdersInProgress > 0 ? totalOrdersInProgress : 1;

  return (
    <div className="space-y-6">
      {/* Progress Bars - Kanban Statuses */}
      <div className="space-y-3">
        {/* Header with total */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {t("columns.status")}
          </span>
          <span className="text-xs text-slate-500">
            {t("orderCount", { count: totalOrdersInProgress })}
          </span>
        </div>

        {progressItems.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-600">{item.label}</span>
              <span className="text-sm font-medium text-slate-700">
                {item.count}
                <span className="text-slate-400 font-normal">
                  {" "}
                  / {totalOrdersInProgress}
                </span>
              </span>
            </div>
            <ProgressBar
              value={item.count}
              max={maxCount}
              color={item.color}
              size="md"
            />
          </div>
        ))}
        {progressItems.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">
            {t("empty.noOrdersInProgress")}
          </p>
        )}
      </div>

      {/* Revenue Card usando MetricCard con gradiente (destacada) */}
      <div className="space-y-3">
        <MetricCard
          title={t("metrics.paid")}
          value={formatCurrency(metrics.recaudos.pagadas.total)}
          subtitle={t("orderCount", { count: metrics.conteos.pagadas })}
          colorScheme="indigo"
          variantType="gradient"
          size="md"
        >
          {/* Separator y pending payment */}
          <div className="border-t border-white/20 my-3" />
          <div>
            <p className="text-xs text-white/60 font-medium uppercase tracking-wide mb-1">
              {t("metrics.pendingPayment")}
            </p>
            <p className="text-xl font-semibold text-white/90">
              {formatCurrency(metrics.recaudos.pendientesPago.total)}
            </p>
            <p className="text-xs text-white/50 mt-0.5">
              {t("orderCount", { count: metrics.conteos.pendientesPago })}
            </p>
          </div>
        </MetricCard>
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
            <Skeleton className="h-1.5 w-full rounded-card-lg" />
          </div>
        ))}
      </div>
      <Skeleton className="h-32 w-full rounded-card-lg" />
    </div>
  );
}

export default OrderMetrics;

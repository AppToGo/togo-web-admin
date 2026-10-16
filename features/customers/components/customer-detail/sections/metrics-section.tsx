"use client";

import { useFormatter, useTranslations } from "next-intl";
import { ShoppingBag, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { KpiCard } from "@/features/dashboard/components/kpi/KpiCard";
import { useLazySection } from "../../../hooks/useLazySection";
import { useCustomerMetrics } from "../../../hooks/useCustomer";
import { daysBetweenOrders } from "../../../utils/order-frequency";
import { formatRelativeDate } from "../../../utils/format-relative-date";
import { MetricsGridSkeleton } from "../skeletons/metrics-grid-skeleton";

interface MetricsSectionProps {
  customerId: string;
}

/** Cuatro números del cliente con la misma tarjeta que los KPIs del dashboard. */
export function MetricsSection({ customerId }: MetricsSectionProps) {
  const t = useTranslations("customers");
  const format = useFormatter();
  const { ref, shouldLoad } = useLazySection(customerId, "metrics");

  const { data: metrics, isLoading } = useCustomerMetrics(
    customerId,
    shouldLoad
  );

  if (isLoading || !metrics) {
    return (
      <div ref={ref} className="w-full">
        <MetricsGridSkeleton />
      </div>
    );
  }

  const every = daysBetweenOrders(metrics);

  return (
    <div ref={ref} className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title={t("metrics.totalSpent")}
        value={formatCurrency(metrics.totalSpent)}
        description={t("card.orders", { count: metrics.totalOrders })}
        icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
        variant="emerald"
      />
      <KpiCard
        title={t("metrics.totalOrders")}
        value={String(metrics.totalOrders)}
        description={
          every === null ? "—" : t("detail.orderEvery", { count: every })
        }
        icon={<ShoppingBag className="h-5 w-5 text-blue-600" />}
        variant="blue"
      />
      <KpiCard
        title={t("metrics.averageOrder")}
        value={formatCurrency(metrics.avgOrderValue)}
        description={t("detail.perOrder")}
        icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
        variant="purple"
      />
      <KpiCard
        title={t("metrics.firstOrder")}
        value={
          metrics.firstOrderDate
            ? format.dateTime(new Date(metrics.firstOrderDate), {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "—"
        }
        description={t("detail.lastOrderAt", {
          date: formatRelativeDate(metrics.lastOrderDate, t),
        })}
        icon={<Calendar className="h-5 w-5 text-amber-600" />}
        variant="amber"
      />
    </div>
  );
}

"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { Package } from "lucide-react";
import { useKpiMetrics } from "../../hooks/useKpiMetrics";
import { CardSkeleton } from "../loading/CardSkeleton";
import { KpiCard } from "./KpiCard";

/** Pedidos del período filtrado, contra el período anterior. */
export const PeriodOrdersCard = memo(function PeriodOrdersCard() {
  const t = useTranslations("dashboard.stats.periodOrders");
  const { data, isLoading } = useKpiMetrics();

  if (isLoading) {
    return <CardSkeleton className="h-36" />;
  }

  return (
    <KpiCard
      title={t("title")}
      value={(data?.totalOrders ?? 0).toString()}
      description={t("description", {
        paid: data?.paidOrders ?? 0,
        pending: data?.pendingOrders ?? 0,
      })}
      icon={<Package className="w-5 h-5 text-purple-600" />}
      trendValue={data?.ordersGrowth}
      variant="purple"
    />
  );
});

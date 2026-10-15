"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { DollarSign } from "lucide-react";
import { useKpiMetrics } from "../../hooks/useKpiMetrics";
import { usePeriodLabel } from "../../hooks/usePeriodLabel";
import { CardSkeleton } from "../loading/CardSkeleton";
import { formatCOP } from "@/features/cash/utils/cash.utils";
import { KpiCard } from "./KpiCard";

/** Ingresos pagados del período filtrado, contra el período anterior. */
export const PeriodRevenueCard = memo(function PeriodRevenueCard() {
  const t = useTranslations("dashboard.stats.periodRevenue");
  const periodLabel = usePeriodLabel();
  const { data, isLoading } = useKpiMetrics();

  if (isLoading) {
    return <CardSkeleton className="h-36" />;
  }

  return (
    <KpiCard
      title={t("title")}
      value={formatCOP(data?.periodRevenue || 0)}
      description={periodLabel}
      icon={<DollarSign className="w-5 h-5 text-blue-600" />}
      trendValue={data?.revenueGrowth}
      variant="blue"
    />
  );
});

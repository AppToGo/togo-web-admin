"use client";

import { memo } from "react";
import { DollarSign } from "lucide-react";
import { useKpiMetrics } from "../../hooks/useKpiMetrics";
import { CardSkeleton } from "../loading/CardSkeleton";
import { formatCOP } from "@/features/cash/utils/cash.utils";
import { KpiCard } from "./KpiCard";

export const RevenueTodayCard = memo(function RevenueTodayCard() {
  const { data, isLoading } = useKpiMetrics();

  if (isLoading) {
    return <CardSkeleton className="h-36" />;
  }

  return (
    <KpiCard
      title="Ingresos Hoy"
      value={formatCOP(data?.revenueToday || 0)}
      description="vs período anterior"
      icon={<DollarSign className="w-5 h-5 text-blue-600" />}
      trendValue={data?.revenueGrowth}
      variant="blue"
    />
  );
});

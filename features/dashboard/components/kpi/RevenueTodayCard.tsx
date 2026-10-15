"use client";

import { memo } from "react";
import { DollarSign } from "lucide-react";
import { useKpiMetrics } from "../../hooks/useKpiMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "./KpiCard";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
}

export const RevenueTodayCard = memo(function RevenueTodayCard() {
  const { data, isLoading } = useKpiMetrics();

  if (isLoading) {
    return <Skeleton className="h-36 rounded-card-xl" />;
  }

  return (
    <KpiCard
      title="Ingresos Hoy"
      value={formatCurrency(data?.revenueToday || 0)}
      description="vs período anterior"
      icon={<DollarSign className="w-5 h-5 text-blue-600" />}
      trend={
        data && data.revenueGrowth > 0
          ? "up"
          : data && data.revenueGrowth < 0
            ? "down"
            : "neutral"
      }
      trendValue={data?.revenueGrowth}
      variant="blue"
    />
  );
});

"use client";

import { memo } from "react";
import { TrendingUp } from "lucide-react";
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

export const AverageTicketCard = memo(function AverageTicketCard() {
  const { data, isLoading } = useKpiMetrics();

  if (isLoading) {
    return <Skeleton className="h-36 rounded-card-xl" />;
  }

  const avgTicket =
    data && data.paidOrders > 0 ? data.revenueToday / data.paidOrders : 0;

  return (
    <KpiCard
      title="Ticket Promedio"
      value={formatCurrency(avgTicket)}
      description="Valor promedio por orden"
      icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
      trend="neutral"
      variant="amber"
    />
  );
});

"use client";

import { memo } from "react";
import { TrendingUp } from "lucide-react";
import { useKpiMetrics } from "../../hooks/useKpiMetrics";
import { CardSkeleton } from "../loading/CardSkeleton";
import { formatCOP } from "@/features/cash/utils/cash.utils";
import { KpiCard } from "./KpiCard";

export const AverageTicketCard = memo(function AverageTicketCard() {
  const { data, isLoading } = useKpiMetrics();

  if (isLoading) {
    return <CardSkeleton className="h-36" />;
  }

  const avgTicket =
    data && data.paidOrders > 0 ? data.revenueToday / data.paidOrders : 0;

  return (
    <KpiCard
      title="Ticket Promedio"
      value={formatCOP(avgTicket)}
      description="Valor promedio por orden"
      icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
      variant="amber"
    />
  );
});

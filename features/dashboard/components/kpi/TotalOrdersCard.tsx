"use client";

import { memo } from "react";
import { Package } from "lucide-react";
import { useKpiMetrics } from "../../hooks/useKpiMetrics";
import { KpiCard } from "./KpiCard";

export const TotalOrdersCard = memo(function TotalOrdersCard() {
  const { data, isLoading } = useKpiMetrics();

  if (isLoading) {
    return <div className="h-32 bg-slate-100 animate-pulse rounded-lg" />;
  }

  return (
    <KpiCard
      title="Total Órdenes"
      value={data?.totalOrders.toString() || "0"}
      description={`${data?.paidOrders || 0} pagadas · ${data?.pendingOrders || 0} pendientes`}
      icon={<Package className="w-5 h-5 text-purple-500" />}
      trend="neutral"
      variant="purple"
    />
  );
});

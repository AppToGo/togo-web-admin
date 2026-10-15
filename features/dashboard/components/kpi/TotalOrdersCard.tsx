"use client";

import { memo } from "react";
import { Package } from "lucide-react";
import { useKpiMetrics } from "../../hooks/useKpiMetrics";
import { CardSkeleton } from "../loading/CardSkeleton";
import { KpiCard } from "./KpiCard";

export const TotalOrdersCard = memo(function TotalOrdersCard() {
  const { data, isLoading } = useKpiMetrics();

  if (isLoading) {
    return <CardSkeleton className="h-36" />;
  }

  return (
    <KpiCard
      title="Total Órdenes"
      value={data?.totalOrders.toString() || "0"}
      description={`${data?.paidOrders || 0} pagadas · ${data?.pendingOrders || 0} pendientes`}
      icon={<Package className="w-5 h-5 text-purple-600" />}
      variant="purple"
    />
  );
});

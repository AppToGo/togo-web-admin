"use client";

import { memo } from "react";
import { ShoppingBag } from "lucide-react";
import { useKpiMetrics } from "../../hooks/useKpiMetrics";
import { CardSkeleton } from "../loading/CardSkeleton";
import { KpiCard } from "./KpiCard";

export const OrdersTodayCard = memo(function OrdersTodayCard() {
  const { data, isLoading } = useKpiMetrics();

  if (isLoading) {
    return <CardSkeleton className="h-36" />;
  }

  return (
    <KpiCard
      title="Órdenes Hoy"
      value={data?.ordersToday.toString() || "0"}
      description={`${data?.ordersCompletedToday || 0} completadas`}
      icon={<ShoppingBag className="w-5 h-5 text-emerald-600" />}
      trendValue={data?.ordersGrowth}
      variant="emerald"
    />
  );
});

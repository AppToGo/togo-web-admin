"use client";

import { memo } from "react";
import { ShoppingBag } from "lucide-react";
import { useKpiMetrics } from "../../hooks/useKpiMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "./KpiCard";

export const OrdersTodayCard = memo(function OrdersTodayCard() {
  const { data, isLoading } = useKpiMetrics();

  if (isLoading) {
    return <Skeleton className="h-36 rounded-card-xl" />;
  }

  return (
    <KpiCard
      title="Órdenes Hoy"
      value={data?.ordersToday.toString() || "0"}
      description={`${data?.ordersCompletedToday || 0} completadas`}
      icon={<ShoppingBag className="w-5 h-5 text-emerald-600" />}
      trend={
        data && data.ordersGrowth > 0
          ? "up"
          : data && data.ordersGrowth < 0
            ? "down"
            : "neutral"
      }
      trendValue={data?.ordersGrowth}
      variant="emerald"
    />
  );
});

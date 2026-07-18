"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { Truck, Store, Utensils } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  progressBarVariants,
  progressBarFillVariants,
} from "../styles";

interface DeliveryMetricsCardProps {
  delivery: number;
  pickup: number;
  dineIn: number;
}

export const DeliveryMetricsCard = memo(function DeliveryMetricsCard({
  delivery,
  pickup,
  dineIn,
}: DeliveryMetricsCardProps) {
  const t = useTranslations("orders");

  const metrics = [
    {
      key: "DELIVERY" as const,
      label: t("deliveryTypes.DELIVERY"),
      count: delivery,
      icon: Truck,
      variant: "blue" as const,
    },
    {
      key: "PICKUP" as const,
      label: t("deliveryTypes.PICKUP"),
      count: pickup,
      icon: Store,
      variant: "amber" as const,
    },
    {
      key: "DINE_IN" as const,
      label: t("deliveryTypes.DINE_IN"),
      count: dineIn,
      icon: Utensils,
      variant: "emerald" as const,
    },
  ].filter((item) => item.count > 0);

  const totalOrders = delivery + pickup + dineIn;
  const maxCount = totalOrders > 0 ? totalOrders : 1;

  return (
    <Card variant="glass" className="p-5">
      {/* Header with total */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {t("columns.delivery")}
        </span>
        <span className="text-xs text-slate-500">
          {t("orderCount", { count: totalOrders })}
        </span>
      </div>

      {/* Metrics rows */}
      <div className="space-y-4">
        {metrics.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      item.variant === "blue"
                        ? "bg-blue-100 text-blue-600"
                        : item.variant === "amber"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-emerald-100 text-emerald-600"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-slate-600">{item.label}</span>
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {item.count}
                  <span className="text-slate-400 font-normal">
                    {" "}
                    / {totalOrders}
                  </span>
                </span>
              </div>
              <div className={progressBarVariants({ size: "default" })}>
                <div
                  className={progressBarFillVariants({ variant: item.variant })}
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {metrics.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-4">
          {t("empty.noOrders")}
        </p>
      )}
    </Card>
  );
});

export function DeliveryMetricsCardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-32" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

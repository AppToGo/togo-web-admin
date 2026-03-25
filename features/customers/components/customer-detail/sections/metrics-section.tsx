"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useLazySection } from "../../../hooks/useLazySection";
import { useCustomerMetrics } from "../../../hooks/useCustomer";
import { MetricsGridSkeleton } from "../skeletons/metrics-grid-skeleton";

interface MetricsSectionProps {
  customerId: string;
}

export function MetricsSection({ customerId }: MetricsSectionProps) {
  const t = useTranslations("customers");
  const { ref, shouldLoad } = useLazySection(customerId, "metrics");

  const { data: metrics, isLoading } = useCustomerMetrics(
    customerId,
    shouldLoad
  );

  const metricCards = [
    {
      title: t("metrics.totalSpent"),
      value: metrics ? formatCurrency(metrics.totalSpent) : "-",
      icon: DollarSign,
      variant: "emerald" as const,
    },
    {
      title: t("metrics.totalOrders"),
      value: metrics ? metrics.totalOrders.toString() : "-",
      icon: ShoppingCart,
      variant: "blue" as const,
    },
    {
      title: t("metrics.averageOrder"),
      value: metrics ? formatCurrency(metrics.avgOrderValue) : "-",
      icon: TrendingUp,
      variant: "purple" as const,
    },
    {
      title: t("metrics.firstOrder"),
      value: metrics?.firstOrderDate
        ? new Date(metrics.firstOrderDate).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
          })
        : "-",
      icon: Calendar,
      variant: "amber" as const,
    },
  ];

  return (
    <div ref={ref} className="w-full">
      {isLoading || !metrics ? (
        <MetricsGridSkeleton />
      ) : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {metricCards.map((card) => (
            <Card key={card.title} variant={`metrics-${card.variant}`}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-card-foreground/80">
                      {card.title}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-card-foreground mt-1 sm:mt-2">
                      {card.value}
                    </p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center">
                    <card.icon
                      className={`h-5 w-5 sm:h-6 sm:w-6 text-${card.variant}-600`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

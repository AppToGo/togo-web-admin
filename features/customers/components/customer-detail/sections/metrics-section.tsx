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
      value: metrics ? formatCurrency(metrics.averageOrderValue) : "-",
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

  const getCardClasses = (variant: string) => {
    // Glassmorphism style como la imagen: fondo translúcido con tinte de color
    const baseClasses = "relative backdrop-blur-2xl ";
    switch (variant) {
      case "emerald":
        return `${baseClasses} bg-gradient-to-br from-emerald-400/15 via-white/10 to-emerald-500/20`;
      case "blue":
        return `${baseClasses} bg-gradient-to-br from-blue-400/15 via-white/10 to-blue-500/20`;
      case "purple":
        return `${baseClasses} bg-gradient-to-br from-purple-400/15 via-white/10 to-purple-500/20`;
      case "amber":
        return `${baseClasses} bg-gradient-to-br from-amber-400/15 via-white/10 to-amber-500/20`;
      default:
        return `${baseClasses} bg-gradient-to-br from-slate-400/15 via-white/10 to-slate-500/20`;
    }
  };

  return (
    <div ref={ref} className="w-full">
      {isLoading || !metrics ? (
        <MetricsGridSkeleton />
      ) : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {metricCards.map((card) => (
            <Card
              key={card.title}
              variant="glass"
              className={getCardClasses(card.variant)}
            >
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

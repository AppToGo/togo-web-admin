"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Calendar,
  Star,
  Package,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { CustomerMetrics } from "../../types";
import { MetricCard, RankingItem } from "@/shared/components/metrics";

interface CustomerMetricsCardProps {
  metrics: CustomerMetrics;
}

export function CustomerMetricsCard({ metrics }: CustomerMetricsCardProps) {
  const t = useTranslations("customers");

  // Definición de métricas usando el sistema estandarizado
  const metricDefinitions = [
    {
      title: t("metrics.totalSpent"),
      value: formatCurrency(metrics.totalSpent),
      icon: DollarSign,
      colorScheme: "emerald" as const,
    },
    {
      title: t("metrics.totalOrders"),
      value: metrics.totalOrders.toString(),
      icon: ShoppingCart,
      colorScheme: "blue" as const,
    },
    {
      title: t("metrics.averageOrder"),
      value: formatCurrency(metrics.averageOrderValue),
      icon: TrendingUp,
      colorScheme: "purple" as const,
    },
    {
      title: t("metrics.firstOrder"),
      value: metrics.firstOrderDate
        ? new Date(metrics.firstOrderDate).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
          })
        : "-",
      icon: Calendar,
      colorScheme: "amber" as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Métricas principales usando MetricCard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricDefinitions.map((metric) => (
          <MetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            colorScheme={metric.colorScheme}
            size="md"
          />
        ))}
      </div>

      {/* Métricas de revenue destacado con gradiente */}
      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard
          title={t("metrics.totalSpent")}
          value={formatCurrency(metrics.totalSpent)}
          subtitle={t("metrics.totalOrders", { count: metrics.totalOrders })}
          icon={DollarSign}
          colorScheme="indigo"
          isGradient
          size="lg"
        />
        <MetricCard
          title={t("metrics.averageOrder")}
          value={formatCurrency(metrics.averageOrderValue)}
          subtitle={t("metrics.averagePerOrder")}
          icon={TrendingUp}
          colorScheme="purple"
          isGradient
          size="lg"
        />
      </div>

      {/* Productos favoritos usando RankingItem */}
      {metrics.favoriteProducts.length > 0 && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 text-amber-500" />
              {t("metrics.favoriteProducts")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {metrics.favoriteProducts.slice(0, 5).map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-50"
                >
                  <RankingItem
                    position={index + 1}
                    name={product.productName}
                    subtitle={t("metrics.timesOrdered", {
                      count: product.totalQuantity,
                    })}
                    className="flex-1 bg-transparent hover:bg-transparent p-0"
                  />
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(product.totalSpent)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t("metrics.totalSpentOnProduct")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen adicional */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">
              {t("metrics.lastOrderDate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {metrics.lastOrderDate
                ? new Date(metrics.lastOrderDate).toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "-"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">
              {t("metrics.customerSince")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {metrics.firstOrderDate
                ? new Date(metrics.firstOrderDate).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "-"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CustomerMetricsCard;

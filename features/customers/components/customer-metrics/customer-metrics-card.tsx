"use client";

import { useTranslations } from "next-intl";
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Calendar,
  Star,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { CustomerMetrics } from "../../types";
import { MetricCard, RankingItem, ProgressBar } from "@/shared/components/metrics";

interface CustomerMetricsCardProps {
  metrics: CustomerMetrics;
}

export function CustomerMetricsCard({ metrics }: CustomerMetricsCardProps) {
  const t = useTranslations("customers");

  // Calcular máximo para progress bars de productos
  const maxProductSpent =
    metrics.favoriteProducts.length > 0
      ? Math.max(...metrics.favoriteProducts.map((p) => p.totalSpent))
      : 1;

  return (
    <div className="space-y-6">
      {/* Métricas principales usando MetricCard CON gradiente (como OrderMetrics) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title={t("metrics.totalSpent")}
          value={formatCurrency(metrics.totalSpent)}
          icon={DollarSign}
          colorScheme="indigo"
          isGradient
          size="md"
        />
        <MetricCard
          title={t("metrics.totalOrders")}
          value={metrics.totalOrders.toString()}
          icon={ShoppingCart}
          colorScheme="indigo"
          isGradient
          size="md"
        />
        <MetricCard
          title={t("metrics.averageOrder")}
          value={formatCurrency(metrics.averageOrderValue)}
          icon={TrendingUp}
          colorScheme="indigo"
          isGradient
          size="md"
        />
        <MetricCard
          title={t("metrics.firstOrder")}
          value={metrics.firstOrderDate
            ? new Date(metrics.firstOrderDate).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
              })
            : "-"}
          icon={Calendar}
          colorScheme="indigo"
          isGradient
          size="md"
        />
      </div>

      {/* Métricas de revenue destacado con gradiente indigo (como OrderMetrics) */}
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
          colorScheme="indigo"
          isGradient
          size="lg"
        />
      </div>

      {/* Productos favoritos con header estandarizado (como OrderMetrics) */}
      {metrics.favoriteProducts.length > 0 && (
        <div className="space-y-3">
          {/* Header estandarizado con border-b y uppercase tracking-wide */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              {t("metrics.favoriteProducts")}
            </span>
            <span className="text-xs text-slate-500">
              {t("metrics.productsCount", { count: metrics.favoriteProducts.length })}
            </span>
          </div>

          <div className="space-y-4">
            {metrics.favoriteProducts.slice(0, 5).map((product, index) => (
              <div key={product.productId} className="space-y-2">
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
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
                <ProgressBar
                  value={product.totalSpent}
                  max={maxProductSpent}
                  color="indigo"
                  size="sm"
                  className="ml-11"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumen adicional con MetricCards con gradiente (como OrderMetrics) */}
      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard
          title={t("metrics.lastOrderDate")}
          value={metrics.lastOrderDate
            ? new Date(metrics.lastOrderDate).toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "-"}
          icon={Calendar}
          colorScheme="indigo"
          isGradient
          size="lg"
        />
        <MetricCard
          title={t("metrics.customerSince")}
          value={metrics.firstOrderDate
            ? new Date(metrics.firstOrderDate).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "-"}
          icon={Calendar}
          colorScheme="indigo"
          isGradient
          size="lg"
        />
      </div>
    </div>
  );
}

export default CustomerMetricsCard;

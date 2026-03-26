"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface CustomerMetricsCardProps {
  metrics: CustomerMetrics;
}

export function CustomerMetricsCard({ metrics }: CustomerMetricsCardProps) {
  const t = useTranslations("customers");

  const metricCards = [
    {
      title: t("metrics.totalSpent"),
      value: formatCurrency(metrics.totalSpent),
      icon: DollarSign,
      variant: "gradient-emerald" as const,
    },
    {
      title: t("metrics.totalOrders"),
      value: metrics.totalOrders.toString(),
      icon: ShoppingCart,
      variant: "gradient-blue" as const,
    },
    {
      title: t("metrics.averageOrder"),
      value: formatCurrency(metrics.averageOrderValue),
      icon: TrendingUp,
      variant: "gradient-purple" as const,
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
      variant: "gradient-amber" as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => (
          <Card key={card.title} variant={card.variant}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-white mt-2">
                    {card.value}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <card.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Productos favoritos */}
      {metrics.favoriteProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 text-amber-500" />
              {t("metrics.favoriteProducts")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.favoriteProducts.slice(0, 5).map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {product.productName}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {t("metrics.timesOrdered", {
                            count: product.totalQuantity,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
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
        <Card variant="gradient-indigo">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-white/80">
              {t("metrics.lastOrderDate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-white">
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

        <Card variant="gradient-indigo">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-white/80">
              {t("metrics.customerSince")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-white">
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

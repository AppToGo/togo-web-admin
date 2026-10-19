"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardCardHeader } from "@/features/dashboard/components/DashboardCardHeader";
import { Star, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useLazySection } from "../../../hooks/useLazySection";
import { useCustomerMetrics } from "../../../hooks/useCustomer";
import { FavoritesSectionSkeleton } from "../skeletons/sections/favorites-section-skeleton";

interface FavoritesSectionProps {
  customerId: string;
}

export function FavoritesSection({ customerId }: FavoritesSectionProps) {
  const t = useTranslations("customers");
  const { ref, shouldLoad } = useLazySection(customerId, "favorites");

  const { data: metrics, isLoading } = useCustomerMetrics(
    customerId,
    shouldLoad
  );

  const favoriteProducts = metrics?.favoriteProducts?.slice(0, 5) || [];

  return (
    <div ref={ref}>
      <Card variant="glass">
        <DashboardCardHeader icon={Star} title={t("metrics.favoriteProducts")} />
        <CardContent>
          {isLoading || !metrics ? (
            <FavoritesSectionSkeleton />
          ) : favoriteProducts.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              {t("detail.noFavorites")}
            </p>
          ) : (
            <div className="space-y-1">
              {favoriteProducts.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between gap-3 rounded-card px-3 py-2.5 transition-colors hover:bg-white/70"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <Package className="h-3 w-3" />
                        {t("metrics.timesOrdered", {
                          count: product.totalQuantity,
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 text-sm">
                      {formatCurrency(product.totalSpent)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t("metrics.totalSpentOnProduct")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

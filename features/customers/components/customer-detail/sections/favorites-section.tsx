"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  console.log("FavoritesSection render", { favoriteProducts });

  return (
    <div ref={ref}>
      <Card variant="glass">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Star className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
            {t("metrics.favoriteProducts")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || !metrics ? (
            <FavoritesSectionSkeleton />
          ) : favoriteProducts.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              {t("detail.noFavorites")}
            </p>
          ) : (
            <div className="space-y-3  pr-1">
              {favoriteProducts.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs sm:text-sm">
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

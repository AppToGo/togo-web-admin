"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  ShoppingCart,
  DollarSign,
  Medal,
  ExternalLink,
  Users,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useGlobalCustomerMetrics } from "../../hooks";

interface TopCustomersChartsProps {
  businessId?: string;
}

export function TopCustomersCharts({ businessId }: TopCustomersChartsProps) {
  const t = useTranslations("customers");
  const { data: metrics, isLoading } = useGlobalCustomerMetrics(businessId);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-1">
        <Card variant="glass">
          <CardHeader className="pb-3 border-b border-white/20">
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardHeader className="pb-3 border-b border-white/20">
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  // Colores para top 3
  const rankColors = [
    { bg: "bg-amber-100", text: "text-amber-700", icon: "text-amber-500" }, // 1st
    { bg: "bg-slate-100", text: "text-slate-700", icon: "text-slate-500" }, // 2nd
    { bg: "bg-orange-100", text: "text-orange-700", icon: "text-orange-500" }, // 3rd
  ];

  const hasData =
    metrics.topByFrequency.length > 0 || metrics.topBySpending.length > 0;

  if (!hasData) {
    return (
      <Card variant="glass">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            {t("topCustomers.noData")}
          </h3>
          <p className="text-slate-500 text-center max-w-sm mt-2">
            {t("topCustomers.noDataDescription")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-1">
      {/* Top por frecuencia */}
      <Card variant="glass">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-amber-500" />
            {t("topCustomers.byFrequency")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {metrics.topByFrequency.length > 0 ? (
            <div className="space-y-3">
              {metrics.topByFrequency.slice(0, 10).map((customer, index) => {
                const colors = rankColors[index] || {
                  bg: "bg-slate-50",
                  text: "text-slate-600",
                  icon: "text-slate-400",
                };
                const isTop3 = index < 3;

                return (
                  <div key={customer.customerId || index}>
                    {index !== 0 && (
                      <div className="w-full border-t border-slate-200/50"></div>
                    )}
                    <Link
                      href={`/dashboard/customers/${customer.customerId}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-white transition-colors group "
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full ${colors.bg} ${colors.text} font-semibold text-sm`}
                        >
                          {isTop3 ? (
                            <Medal className={`h-4 w-4 ${colors.icon}`} />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {customer.name || t("table.anonymous")}
                          </p>
                          <p className="text-sm text-slate-500">
                            {customer.phoneNumber}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <ExternalLink className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">
              {t("topCustomers.noFrequencyData")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Top por gasto */}
      <Card variant="glass">
        <CardHeader className="pb-3 border-b border-white/20">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            {t("topCustomers.bySpending")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {metrics.topBySpending.length > 0 ? (
            <div className="space-y-3">
              {metrics.topBySpending.slice(0, 10).map((customer, index) => {
                const colors = rankColors[index] || {
                  bg: "bg-slate-50",
                  text: "text-slate-600",
                  icon: "text-slate-400",
                };
                const isTop3 = index < 3;

                return (
                  <>
                    {index !== 0 && (
                      <div className="w-full border-t border-slate-200/50"></div>
                    )}
                    <Link
                      key={customer.customerId || index}
                      href={`/dashboard/customers/${customer.customerId}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-white transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full ${colors.bg} ${colors.text} font-semibold text-sm`}
                        >
                          {isTop3 ? (
                            <Medal className={`h-4 w-4 ${colors.icon}`} />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {customer.name || t("table.anonymous")}
                          </p>
                          <p className="text-sm text-slate-500">
                            {customer.phoneNumber}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-emerald-600">
                          {formatCurrency(customer.value)}
                        </span>
                        <ExternalLink className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  </>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">
              {t("topCustomers.noSpendingData")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

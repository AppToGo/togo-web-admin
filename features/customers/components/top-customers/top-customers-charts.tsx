"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
  DollarSign,
  Users,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useGlobalCustomerMetrics } from "../../hooks";
import { RankingItem, ProgressBar } from "@/shared/components/metrics";

interface TopCustomersChartsProps {
  businessId?: string;
}

export function TopCustomersCharts({ businessId }: TopCustomersChartsProps) {
  const t = useTranslations("customers");
  const { data: metrics, isLoading } = useGlobalCustomerMetrics(businessId);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
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

  const hasData =
    metrics.topByFrequency.length > 0 || metrics.topBySpending.length > 0;

  if (!hasData) {
    return (
      <Card>
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

  // Calcular máximo para progress bars de gasto
  const maxSpending =
    metrics.topBySpending.length > 0
      ? Math.max(...metrics.topBySpending.map((c) => c.value))
      : 1;

  return (
    <div className="grid gap-6 md:grid-cols-1">
      {/* Top por frecuencia - Header estandarizado como OrderMetrics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            {t("topCustomers.byFrequency")}
          </span>
          <span className="text-xs text-slate-500">
            {t("topCustomers.count", { count: metrics.topByFrequency.length })}
          </span>
        </div>

        {metrics.topByFrequency.length > 0 ? (
          <div className="space-y-2">
            {metrics.topByFrequency.slice(0, 10).map((customer, index) => (
              <RankingItem
                key={customer.customerId || index}
                position={index + 1}
                name={customer.name || t("table.anonymous")}
                subtitle={customer.phoneNumber}
                href={`/dashboard/customers/${customer.customerId}`}
              />
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-8">
            {t("topCustomers.noFrequencyData")}
          </p>
        )}
      </div>

      {/* Top por gasto - Header estandarizado como OrderMetrics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            {t("topCustomers.bySpending")}
          </span>
          <span className="text-xs text-slate-500">
            {t("topCustomers.count", { count: metrics.topBySpending.length })}
          </span>
        </div>

        {metrics.topBySpending.length > 0 ? (
          <div className="space-y-4">
            {metrics.topBySpending.slice(0, 10).map((customer, index) => (
              <div key={customer.customerId || index} className="space-y-2">
                <RankingItem
                  position={index + 1}
                  name={customer.name || t("table.anonymous")}
                  subtitle={customer.phoneNumber}
                  value={formatCurrency(customer.value)}
                  href={`/dashboard/customers/${customer.customerId}`}
                />
                <ProgressBar
                  value={customer.value}
                  max={maxSpending}
                  color="indigo"
                  size="sm"
                  className="ml-11"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-8">
            {t("topCustomers.noSpendingData")}
          </p>
        )}
      </div>
    </div>
  );
}

export default TopCustomersCharts;

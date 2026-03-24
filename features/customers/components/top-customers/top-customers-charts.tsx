"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, DollarSign, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useGlobalCustomerMetrics } from "../../hooks";
import {
  RankingItem,
  ProgressBar,
  GlassCard,
} from "@/shared/components/metrics";

interface TopCustomersChartsProps {
  businessId?: string;
}

export function TopCustomersCharts({ businessId }: TopCustomersChartsProps) {
  const t = useTranslations("customers");
  const { data: metrics, isLoading } = useGlobalCustomerMetrics(businessId);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-1">
        <GlassCard variant="glass">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </GlassCard>
        <GlassCard variant="glass">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </GlassCard>
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
      <GlassCard variant="glass">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            {t("topCustomers.noData")}
          </h3>
          <p className="text-slate-500 text-center max-w-sm mt-2">
            {t("topCustomers.noDataDescription")}
          </p>
        </div>
      </GlassCard>
    );
  }

  // Calcular máximo para progress bars de gasto
  const maxSpending =
    metrics.topBySpending.length > 0
      ? Math.max(...metrics.topBySpending.map((c) => c.value))
      : 1;

  return (
    <div className="grid gap-6 md:grid-cols-1">
      {/* Top por frecuencia */}
      <GlassCard
        variant="glass"
        header={{
          title: t("topCustomers.byFrequency"),
          icon: <Trophy className="h-5 w-5 text-amber-500" />,
          rightContent:
            metrics.topByFrequency.length > 0
              ? t("topCustomers.count", {
                  count: metrics.topByFrequency.length,
                })
              : undefined,
        }}
      >
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
      </GlassCard>

      {/* Top por gasto */}
      <GlassCard
        variant="glass"
        header={{
          title: t("topCustomers.bySpending"),
          icon: <DollarSign className="h-5 w-5 text-emerald-500" />,
          rightContent:
            metrics.topBySpending.length > 0
              ? t("topCustomers.count", {
                  count: metrics.topBySpending.length,
                })
              : undefined,
        }}
      >
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
                  color="emerald"
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
      </GlassCard>
    </div>
  );
}

export default TopCustomersCharts;

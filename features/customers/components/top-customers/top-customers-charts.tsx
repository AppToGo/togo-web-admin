"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import { DollarSign, Trophy, Users } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, cn } from "@/lib/utils";
import { DashboardCardHeader } from "@/features/dashboard/components/DashboardCardHeader";
import { useGlobalCustomerMetrics } from "../../hooks";

interface TopCustomersChartsProps {
  businessId?: string;
  branchId?: string;
}

/** Colores del puesto: oro, plata y bronce; el resto, translúcido. */
const RANK_COLORS = [
  "bg-amber-100 text-amber-700",
  "bg-slate-200 text-slate-700",
  "bg-orange-100 text-orange-700",
];

/** Cuántos se ven de entrada; "Ver top 10" muestra el resto. */
const COLLAPSED = 5;

interface RankingRow {
  customerId: string;
  name: string | null;
  value: string;
}

export function TopCustomersCharts({ businessId, branchId }: TopCustomersChartsProps) {
  const t = useTranslations("customers");
  const { data: metrics, isLoading } = useGlobalCustomerMetrics({ businessId, branchId });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-80 rounded-card-xl bg-white/60" />
        <Skeleton className="h-80 rounded-card-xl bg-white/60" />
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
      <Card variant="glass">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <Users className="h-8 w-8 text-indigo-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            {t("topCustomers.noData")}
          </h3>
          <p className="mt-2 max-w-sm text-center text-slate-500">
            {t("topCustomers.noDataDescription")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <RankingCard
        icon={Trophy}
        title={t("topCustomers.byFrequency")}
        empty={t("topCustomers.noFrequencyData")}
        rows={metrics.topByFrequency.slice(0, 10).map((customer) => ({
          customerId: customer.customerId,
          name: customer.name,
          value: t("card.orders", { count: customer.totalOrders }),
        }))}
      />
      <RankingCard
        icon={DollarSign}
        title={t("topCustomers.bySpending")}
        empty={t("topCustomers.noSpendingData")}
        rows={metrics.topBySpending.slice(0, 10).map((customer) => ({
          customerId: customer.customerId,
          name: customer.name,
          value: formatCurrency(customer.value),
        }))}
        strongValue
      />
    </div>
  );
}

function RankingCard({
  icon,
  title,
  empty,
  rows,
  strongValue = false,
}: {
  icon: LucideIcon;
  title: string;
  empty: string;
  rows: RankingRow[];
  /** El monto gastado va en negrita; la cantidad de pedidos, en gris. */
  strongValue?: boolean;
}) {
  const t = useTranslations("customers");
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, COLLAPSED);

  return (
    <Card variant="glass">
      <DashboardCardHeader icon={icon} title={title} />
      <CardContent className="space-y-1">
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">{empty}</p>
        ) : (
          <>
            <ol className="space-y-1">
              {visible.map((row, index) => (
                <li key={row.customerId || index}>
                  <Link
                    href={`/dashboard/customers/${row.customerId}`}
                    className="flex items-center gap-3 rounded-card px-3 py-2.5 transition-colors hover:bg-white/70"
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        RANK_COLORS[index] ?? "bg-white/80 text-slate-500"
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
                      {row.name || t("table.noName")}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-[13px] tabular-nums",
                        strongValue ? "font-semibold text-slate-900" : "text-slate-500"
                      )}
                    >
                      {row.value}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
            {rows.length > COLLAPSED && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="px-3 pt-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                {expanded ? t("topCustomers.showLess") : t("topCustomers.showAll")}
              </button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

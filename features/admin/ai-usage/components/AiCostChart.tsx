"use client";

import { useLocale, useTranslations } from "next-intl";
import { TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardCardHeader } from "@/features/dashboard/components/DashboardCardHeader";
import type { AiUsageDaily } from "@/types/ai-usage.types";
import { formatUsd } from "@/features/admin/ai-usage/utils/ai-usage.utils";

/** Gasto de IA por día del rango, en USD. */
export function AiCostChart({
  daily,
  totalUsd,
}: {
  daily: AiUsageDaily[];
  totalUsd: number;
}) {
  const t = useTranslations("admin-ai-usage");
  const locale = useLocale();

  // Días YYYY-MM-DD: se formatean en UTC para que no se corran un día.
  const data = daily.map((point) => ({
    label: new Date(`${point.date}T00:00:00Z`).toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      timeZone: "UTC",
    }),
    costUsd: point.costUsd,
    calls: point.calls,
  }));

  return (
    <Card variant="glass" className="h-full">
      <DashboardCardHeader
        icon={TrendingUp}
        title={t("chart.title")}
        subtitle={t("chart.subtitle")}
      >
        <div className="sm:text-right">
          <p className="text-xs text-slate-500">{t("chart.total")}</p>
          <p className="text-xl font-bold tabular-nums text-slate-900">
            {formatUsd(totalUsd, locale)}
          </p>
        </div>
      </DashboardCardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorAiCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                width={64}
                tickFormatter={(value: number) =>
                  formatUsd(value, locale, true)
                }
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const point = payload[0].payload as (typeof data)[number];
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                      <p className="mb-1 text-sm text-slate-600">{label}</p>
                      <p className="text-lg font-semibold text-indigo-600">
                        {formatUsd(point.costUsd, locale)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t("chart.calls", { count: point.calls })}
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="costUsd"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAiCost)"
                // Con un solo día (rango "Hoy") el área no dibuja nada: el
                // punto muestra el valor.
                dot={
                  data.length === 1
                    ? { r: 5, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }
                    : false
                }
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

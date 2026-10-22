/**
 * WhatsAppUsageChart
 * Consumo de mensajería del mes en el dashboard del negocio: barras por día
 * (gratis y cobrados) y una línea acumulada de gratis contra el cupo de
 * 1.000, con la marca del 80 %. Un número a la vez (el cupo es por número).
 * Con una sede elegida en el dashboard solo muestra sus números y los
 * compartidos del negocio, nunca los de otras sedes.
 * El conteo es en vivo y se refresca solo cada minuto; "Actualizar" pide a
 * Meta la cifra oficial sin esperar la conciliación horaria.
 */

"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MessageCircle, RefreshCw } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardCardHeader } from "@/features/dashboard/components/DashboardCardHeader";
import { useDashboardBranchId } from "@/features/dashboard/stores/branch-filter.store";
import {
  useSyncWhatsAppUsage,
  useWhatsAppUsage,
} from "../hooks/useWhatsAppUsage";

/** Cupo gratis por número y mes (doc oficial de Meta, igual que la API). */
export const FREE_MESSAGES_PER_MONTH = 1000;
const WARN_AT = FREE_MESSAGES_PER_MONTH * 0.8;

const FREE_COLOR = "#22c55e";
const BILLED_COLOR = "#f97316";
const TOTAL_COLOR = "#6366f1";

export function WhatsAppUsageChart() {
  const t = useTranslations("whatsapp");
  const locale = useLocale();
  const { data } = useWhatsAppUsage();
  const sync = useSyncWhatsAppUsage();
  const branchId = useDashboardBranchId();
  const [selected, setSelected] = useState<string | null>(null);

  // Sin sedes en el routing el número es compartido: atiende a todas.
  // `?? []` cubre una API anterior que aún no manda `branchIds`.
  const accounts = (data?.accounts ?? []).filter((a) => {
    const branchIds = a.branchIds ?? [];
    return !branchId || branchIds.length === 0 || branchIds.includes(branchId);
  });
  if (accounts.length === 0) return null;
  const account = accounts.find((a) => a.accountId === selected) ?? accounts[0];

  // Acumulado de gratis día a día, para la línea contra el cupo.
  const points = account.daily.map((day, index) => ({
    // Días YYYY-MM-DD: se formatean en UTC para que no se corran un día.
    label: new Date(`${day.date}T00:00:00Z`).toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      timeZone: "UTC",
    }),
    free: day.free,
    billed: day.billed,
    accumulated: account.daily
      .slice(0, index + 1)
      .reduce((sum, d) => sum + d.free, 0),
  }));
  const current = account.current;
  const number = (value: number) => value.toLocaleString(locale);
  const syncedAt = current.syncedAt
    ? new Date(current.syncedAt).toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <Card variant="glass" className="h-full">
      <DashboardCardHeader
        icon={MessageCircle}
        title={t("usageChart.title")}
        subtitle={t("usageChart.subtitle")}
      >
        <div className="flex gap-6 sm:text-right">
          <div>
            <p className="text-xs text-slate-500">{t("usageChart.free")}</p>
            <p className="text-xl font-bold tabular-nums text-slate-900">
              {number(current.freeMessages)}
              <span className="text-sm font-medium text-slate-400">
                {" "}
                / {number(FREE_MESSAGES_PER_MONTH)}
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{t("usageChart.billed")}</p>
            <p
              className={`text-xl font-bold tabular-nums ${
                current.billableMessages > 0
                  ? "text-orange-600"
                  : "text-slate-900"
              }`}
            >
              {number(current.billableMessages)}
            </p>
          </div>
        </div>
      </DashboardCardHeader>
      <CardContent>
        {accounts.length > 1 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {accounts.map((a) => (
              <button
                key={a.accountId}
                type="button"
                onClick={() => setSelected(a.accountId)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  a.accountId === account.accountId
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                {a.phoneNumber}
              </button>
            ))}
          </div>
        )}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={points}
              margin={{ top: 10, right: 4, left: 0, bottom: 0 }}
            >
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
                yAxisId="day"
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <YAxis
                yAxisId="month"
                orientation="right"
                domain={[
                  0,
                  (max: number) => Math.max(FREE_MESSAGES_PER_MONTH, max),
                ]}
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <ReferenceLine
                yAxisId="month"
                y={WARN_AT}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{
                  value: "80 %",
                  position: "insideTopRight",
                  fill: "#b45309",
                  fontSize: 11,
                }}
              />
              <ReferenceLine
                yAxisId="month"
                y={FREE_MESSAGES_PER_MONTH}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{
                  value: t("usageChart.quotaLine"),
                  position: "insideTopRight",
                  fill: "#b91c1c",
                  fontSize: 11,
                }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const point = payload[0].payload as (typeof points)[number];
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg">
                      <p className="mb-1 text-sm text-slate-600">{label}</p>
                      <p className="text-green-700">
                        {t("usageChart.tooltipFree", {
                          count: number(point.free),
                        })}
                      </p>
                      <p className="text-orange-700">
                        {t("usageChart.tooltipBilled", {
                          count: number(point.billed),
                        })}
                      </p>
                      <p className="mt-1 font-semibold text-indigo-700">
                        {t("usageChart.tooltipAccumulated", {
                          count: number(point.accumulated),
                          quota: number(FREE_MESSAGES_PER_MONTH),
                        })}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar
                yAxisId="day"
                dataKey="free"
                stackId="day"
                fill={FREE_COLOR}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                yAxisId="day"
                dataKey="billed"
                stackId="day"
                fill={BILLED_COLOR}
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="month"
                type="monotone"
                dataKey="accumulated"
                stroke={TOTAL_COLOR}
                strokeWidth={2}
                dot={points.length === 1 ? { r: 4 } : false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <i
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: FREE_COLOR }}
            />
            {t("usageChart.legendFree")}
          </span>
          <span className="flex items-center gap-1.5">
            <i
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: BILLED_COLOR }}
            />
            {t("usageChart.legendBilled")}
          </span>
          <span className="flex items-center gap-1.5">
            <i
              className="h-0.5 w-3 rounded"
              style={{ background: TOTAL_COLOR }}
            />
            {t("usageChart.legendAccumulated")}
          </span>
          <span className="sm:ml-auto">
            {syncedAt
              ? t("usageChart.syncedAt", { time: syncedAt })
              : t("usageChart.notSynced")}
          </span>
          <Button
            variant="slate-outline"
            size="sm"
            isLoading={sync.isPending}
            onClick={() => sync.mutate()}
          >
            {!sync.isPending && <RefreshCw aria-hidden />}
            {t("usageChart.sync")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

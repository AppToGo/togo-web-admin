"use client";
/**
 * KPIs del turno abierto con las variantes `metrics-*` del sistema (misma
 * estructura que `KpiCard`). Todo viene calculado del servidor.
 */
import { useTranslations } from "next-intl";
import { ArrowLeftRight, Banknote, Bike, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCOP } from "../utils/cash.utils";
import type { SessionSummary } from "../types/cash.types";

interface SessionSummaryProps {
  summary: SessionSummary;
  pendingTotal: string;
  pendingCount: number;
}

type MetricVariant = "metrics-purple" | "metrics-emerald" | "metrics-blue" | "metrics-amber";

function Metric({
  variant,
  title,
  value,
  description,
  icon,
}: {
  variant: MetricVariant;
  title: string;
  value: React.ReactNode;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card variant={variant} className="transition-shadow duration-200 hover:shadow-md">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 md:text-2xl">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          </div>
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 md:flex">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Ingresos manuales y salidas (egresos, retiros, reembolsos) del turno. Lo
 * comparten estas tarjetas y la franja de KPIs de Caja · Vender.
 */
export function manualTotals(summary: SessionSummary) {
  const inRows = summary.totalsByType.filter(
    (row) => row.type === "MANUAL_IN" && row.direction === "IN"
  );
  const outRows = summary.totalsByType.filter(
    (row) =>
      row.direction === "OUT" &&
      (row.type === "MANUAL_OUT" || row.type === "WITHDRAWAL" || row.type === "REFUND")
  );
  const sum = (rows: typeof inRows) => rows.reduce((acc, row) => acc + Number(row.total), 0);
  const count = (rows: typeof inRows) => rows.reduce((acc, row) => acc + row.count, 0);
  return {
    manualIn: sum(inRows),
    manualOut: sum(outRows),
    inCount: count(inRows),
    outCount: count(outRows),
  };
}

export function SessionSummaryCard({ summary, pendingTotal, pendingCount }: SessionSummaryProps) {
  const t = useTranslations("cash");
  const { manualIn, manualOut, inCount, outCount } = manualTotals(summary);

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
      <Metric
        variant="metrics-purple"
        title={t("kpi.expected")}
        value={formatCOP(summary.expectedAmount)}
        description={t("kpi.expectedDesc")}
        icon={<Wallet className="h-6 w-6 text-purple-700" />}
      />
      <Metric
        variant="metrics-emerald"
        title={t("kpi.cashSales")}
        value={formatCOP(summary.cashSales.total)}
        description={t("kpi.cashSalesDesc", { count: summary.cashSales.count })}
        icon={<Banknote className="h-6 w-6 text-emerald-700" />}
      />
      <Metric
        variant="metrics-blue"
        title={t("kpi.inOut")}
        value={
          <>
            <span className="text-emerald-700">+ {formatCOP(manualIn)}</span>
            <span className="text-slate-400"> · </span>
            <span className="text-red-700">− {formatCOP(manualOut)}</span>
          </>
        }
        description={t("kpi.inOutDesc", { inCount, outCount })}
        icon={<ArrowLeftRight className="h-6 w-6 text-blue-700" />}
      />
      <Metric
        variant="metrics-amber"
        title={t("kpi.pending")}
        value={formatCOP(pendingTotal)}
        description={t("kpi.pendingDesc", { count: pendingCount })}
        icon={<Bike className="h-6 w-6 text-amber-700" />}
      />
    </div>
  );
}

"use client";
/**
 * Franja compacta de KPIs del turno en Caja · Vender (docs/caja-pos.md):
 * los mismos datos de `SessionSummaryCard`, en una línea que lleva a la
 * pestaña Turno. Todo viene calculado del servidor.
 */
import { useTranslations } from "next-intl";
import { ArrowLeftRight, Banknote, Bike, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCOP } from "../../utils/cash.utils";
import { manualTotals } from "../SessionSummary";
import type { SessionSummary } from "../../types/cash.types";

interface ShiftKpiStripProps {
  summary: SessionSummary;
  pendingTotal: string;
}

export function ShiftKpiStrip({ summary, pendingTotal }: ShiftKpiStripProps) {
  const t = useTranslations("cash");
  const { manualIn, manualOut } = manualTotals(summary);

  const items = [
    {
      key: "expected",
      variant: "metrics-purple" as const,
      icon: <Wallet className="h-4 w-4 text-purple-700" />,
      label: t("pos.kpi.expected"),
      value: formatCOP(summary.expectedAmount),
    },
    {
      key: "sales",
      variant: "metrics-emerald" as const,
      icon: <Banknote className="h-4 w-4 text-emerald-700" />,
      label: t("pos.kpi.cashSales"),
      value: formatCOP(summary.cashSales.total),
    },
    {
      key: "inOut",
      variant: "metrics-blue" as const,
      icon: <ArrowLeftRight className="h-4 w-4 text-blue-700" />,
      label: t("pos.kpi.inOut"),
      value: (
        <>
          <span className="text-emerald-700">+{formatCOP(manualIn)}</span>
          <span className="text-slate-400"> · </span>
          <span className="text-red-700">−{formatCOP(manualOut)}</span>
        </>
      ),
    },
    {
      key: "pending",
      variant: "metrics-amber" as const,
      icon: <Bike className="h-4 w-4 text-amber-700" />,
      label: t("pos.kpi.pending"),
      value: formatCOP(pendingTotal),
    },
  ];

  return (
    <>
    {/* Teléfono: un chip con lo que está en caja y lo que falta liquidar;
        el detalle vive en Más › Turno. */}
    <div
      className="flex w-full items-center gap-3 rounded-card bg-white/70 px-4 py-2.5 md:hidden"
      data-testid="pos-kpi-chip"
    >
      <span className="flex flex-1 flex-col">
        <span className="text-xs font-medium text-indigo-700">{t("pos.kpi.expected")}</span>
        <span className="text-lg font-bold tabular-nums text-slate-900">
          {formatCOP(summary.expectedAmount)}
        </span>
      </span>
      <span className="flex flex-col items-end">
        <span className="text-xs font-medium text-amber-700">{t("pos.kpi.pending")}</span>
        <span className="text-sm font-semibold tabular-nums text-slate-700">
          {formatCOP(pendingTotal)}
        </span>
      </span>
    </div>
    <div
      className="hidden w-full grid-cols-2 gap-2 sm:grid-cols-4 md:grid"
      data-testid="pos-kpi-strip"
    >
      {items.map((item) => (
        <Card key={item.key} variant={item.variant} className="px-3 py-2">
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            {item.icon}
            {item.label}
          </p>
          <p className="mt-0.5 truncate text-base font-bold tabular-nums text-slate-900">
            {item.value}
          </p>
        </Card>
      ))}
    </div>
    </>
  );
}

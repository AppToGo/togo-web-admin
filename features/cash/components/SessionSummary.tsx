"use client";
/**
 * Resumen del turno abierto: esperado, ventas en efectivo, otros medios
 * y por-liquidar. Todo viene calculado del servidor (`expectedAmount`,
 * `cashSales`, `otherPaymentMethods`).
 */
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCOP } from "../utils/cash.utils";
import type { SessionSummary } from "../types/cash.types";

interface SessionSummaryProps {
  summary: SessionSummary;
  pendingTotal: string;
  pendingCount: number;
}

export function SessionSummaryCard({ summary, pendingTotal, pendingCount }: SessionSummaryProps) {
  const t = useTranslations("cash");

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">
            {t("summary.expected")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCOP(summary.expectedAmount)}</p>
          <p className="text-xs text-slate-500">
            {t("sessions.opening")}: {formatCOP(summary.session.openingAmount)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">
            {t("summary.cashSales")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCOP(summary.cashSales.total)}</p>
          <p className="text-xs text-slate-500">
            {summary.cashSales.count}{" "}
            {t("summary.movements").toLowerCase()}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">
            {t("summary.otherMethods")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {summary.otherPaymentMethods.length === 0 && (
              <li className="text-sm text-slate-400">—</li>
            )}
            {summary.otherPaymentMethods.map((row) => (
              <li key={row.method} className="flex justify-between text-sm">
                <span className="text-slate-500">{row.method}</span>
                <span className="font-medium">{formatCOP(row.total)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">
            {t("summary.pendingCollections")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCOP(pendingTotal)}</p>
          <p className="text-xs text-slate-500">
            {pendingCount} {t("collections.toSettle").toLowerCase()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";
/**
 * Historial de turnos cerrados con filtro "Solo con diferencia" (plan).
 * Pide solo CLOSED: un turno abierto no tiene diferencia ni fecha de cierre.
 */
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { differenceTone, formatCOP } from "../utils/cash.utils";
import { useSessionsHistory } from "../hooks/useCash";

interface SessionsHistoryProps {
  businessId: string;
  branchId: string;
}

const headClass = "text-xs font-semibold uppercase tracking-wide text-slate-500";

export function SessionsHistory({ businessId, branchId }: SessionsHistoryProps) {
  const t = useTranslations("cash");
  const locale = useLocale();
  const [onlyWithDifference, setOnlyWithDifference] = useState(false);
  const { data, isLoading } = useSessionsHistory(businessId, branchId, {
    page: 1,
    limit: 50,
    status: "CLOSED",
  });

  const items = (data?.items ?? []).filter((session) =>
    onlyWithDifference ? Number(session.difference ?? 0) !== 0 : true
  );

  const when = (value: string | null) =>
    value
      ? new Date(value).toLocaleString(locale, {
          day: "numeric",
          month: "short",
          hour: "numeric",
          minute: "2-digit",
        })
      : "—";

  return (
    <Card variant="glass">
      <CardContent className="p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">
            {t("sessions.history")}
          </h2>
          <button
            type="button"
            aria-pressed={onlyWithDifference}
            onClick={() => setOnlyWithDifference((prev) => !prev)}
            className={cn(
              "rounded-card px-4 py-2.5 text-sm font-medium transition-colors",
              onlyWithDifference
                ? "bg-indigo-100 text-indigo-700"
                : "bg-white text-slate-600 hover:text-slate-900"
            )}
          >
            {t("sessions.onlyWithDifference")}
          </button>
        </div>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-slate-500">…</p>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {t("sessions.noHistory")}
          </p>
        ) : (
          <Table className="min-w-[820px]">
            <TableHeader className="[&_tr]:border-slate-300/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className={headClass}>{t("history.register")}</TableHead>
                <TableHead className={headClass}>{t("sessions.openedBy")}</TableHead>
                <TableHead className={headClass}>{t("sessions.closedBy")}</TableHead>
                <TableHead className={cn(headClass, "text-right")}>
                  {t("sessions.opening")}
                </TableHead>
                <TableHead className={cn(headClass, "text-right")}>
                  {t("sessions.expected")}
                </TableHead>
                <TableHead className={cn(headClass, "text-right")}>
                  {t("sessions.counted")}
                </TableHead>
                <TableHead className={cn(headClass, "text-right")}>
                  {t("sessions.difference")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((session) => {
                const { tone, value } = differenceTone(session.difference);
                return (
                  <TableRow
                    key={session.id}
                    className="border-slate-300/50 hover:bg-white/40"
                  >
                    <TableCell className="font-semibold text-slate-900">
                      {session.register.name}
                    </TableCell>
                    <TableCell>
                      <p>{session.openedByName ?? "—"}</p>
                      <p className="text-xs text-slate-500">{when(session.openedAt)}</p>
                    </TableCell>
                    <TableCell>
                      <p>{session.closedByName ?? "—"}</p>
                      <p className="text-xs text-slate-500">{when(session.closedAt)}</p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCOP(session.openingAmount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCOP(session.expectedAmount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCOP(session.countedAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
                          tone === "exact" && "bg-emerald-100 text-emerald-800",
                          tone === "shortage" && "bg-red-100 text-red-800",
                          tone === "surplus" && "bg-blue-100 text-blue-800"
                        )}
                      >
                        {tone === "exact"
                          ? t("history.balanced")
                          : `${tone === "shortage" ? "− " : "+ "}${formatCOP(Math.abs(value))}`}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

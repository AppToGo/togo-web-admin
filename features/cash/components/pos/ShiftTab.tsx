"use client";
/**
 * Caja · Turno (docs/caja-pos.md): lo que antes era la vista principal de
 * Caja, sin cambios de lógica — cajas, franja del turno, KPIs, movimientos
 * y otros medios de pago.
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCashDateFormat } from "../../utils/cash-time";
import { useSessionMovements } from "../../hooks/useCash";
import { formatCOP } from "../../utils/cash.utils";
import { RegisterTabs } from "../RegisterTabs";
import { SessionSummaryCard } from "../SessionSummary";
import { MovementsTable } from "../MovementsTable";
import type { CashRegister, SessionSummary } from "../../types/cash.types";

const MOVEMENTS_PAGE_SIZE = 30;

interface ShiftTabProps {
  businessId: string;
  branchId: string;
  registers: CashRegister[];
  register: CashRegister | null;
  onSelectRegister: (id: string) => void;
  summary: SessionSummary | undefined;
  pendingTotal: string;
  pendingCount: number;
  canManage: boolean;
}

export function ShiftTab({
  businessId,
  branchId,
  registers,
  register,
  onSelectRegister,
  summary,
  pendingTotal,
  pendingCount,
  canManage,
}: ShiftTabProps) {
  const t = useTranslations("cash");
  const fmt = useCashDateFormat();
  const openSession = register?.openSession ?? null;
  const openSessionId = openSession?.id ?? null;

  // La página vuelve a 1 al cambiar de caja.
  const [movementsPage, setMovementsPage] = useState(1);
  const { data: movementsData } = useSessionMovements(
    businessId,
    branchId,
    openSessionId,
    {
      page: movementsPage,
      limit: MOVEMENTS_PAGE_SIZE,
    }
  );
  const movementsTotal = movementsData?.total ?? 0;
  const movementsPages = Math.max(
    1,
    Math.ceil(movementsTotal / MOVEMENTS_PAGE_SIZE)
  );

  return (
    <div className="space-y-6">
      <RegisterTabs
        businessId={businessId}
        branchId={branchId}
        registers={registers}
        selectedId={register?.id ?? null}
        onSelect={(id) => {
          onSelectRegister(id);
          setMovementsPage(1);
        }}
        canManage={canManage}
      />

      <div className="flex flex-wrap items-center gap-3 rounded-card-lg border border-white/80 bg-white/40 px-5 py-3.5 backdrop-blur-xl">
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            openSession ? "bg-emerald-600" : "bg-slate-400"
          )}
        />
        {openSession ? (
          <>
            <span className="font-semibold text-slate-900">
              {t("strip.open")}
            </span>
            <span className="text-sm text-slate-600">
              {t("strip.detail", {
                name: openSession.openedByName ?? "—",
                time: fmt.time(openSession.openedAt),
                amount: formatCOP(summary?.session.openingAmount ?? 0),
              })}
            </span>
          </>
        ) : (
          <>
            <span className="font-semibold text-slate-900">
              {t("strip.closed")}
            </span>
            <span className="text-sm text-slate-600">
              {t("strip.closedHint")}
            </span>
          </>
        )}
      </div>

      {summary && (
        <SessionSummaryCard
          summary={summary}
          pendingTotal={pendingTotal}
          pendingCount={pendingCount}
        />
      )}

      <div className="grid items-start gap-6 xl:grid-cols-5">
        <Card variant="glass" className="xl:col-span-3">
          <CardContent className="p-6">
            <h2 className="mb-3 text-base font-semibold text-slate-900">
              {t("table.title")}
            </h2>
            <MovementsTable movements={movementsData?.items ?? []} />
            {movementsPages > 1 && (
              <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-600">
                <span className="tabular-nums">
                  {t("table.pageOf", {
                    page: movementsPage,
                    pages: movementsPages,
                    total: movementsTotal,
                  })}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={t("table.previous")}
                    disabled={movementsPage <= 1}
                    onClick={() => setMovementsPage((page) => page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={t("table.next")}
                    disabled={movementsPage >= movementsPages}
                    onClick={() => setMovementsPage((page) => page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {summary && (
          <Card variant="glass" className="xl:col-span-2">
            <CardContent className="p-6">
              <h2 className="text-base font-semibold text-slate-900">
                {t("otherMethods.title")}
              </h2>
              <p className="mb-3 text-xs text-slate-500">
                {t("otherMethods.hint")}
              </p>
              {summary.otherPaymentMethods.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {t("otherMethods.none")}
                </p>
              ) : (
                <ul>
                  {summary.otherPaymentMethods.map((row) => (
                    <li
                      key={row.method}
                      className="flex justify-between border-t border-slate-300/50 py-2.5 text-sm"
                    >
                      <span className="text-slate-700">
                        {t("otherMethods.row", {
                          method: row.method,
                          count: row.count,
                        })}
                      </span>
                      <span className="font-semibold tabular-nums">
                        {formatCOP(row.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

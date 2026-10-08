"use client";
/**
 * Historial de turnos cerrados con filtro "Solo con diferencia" (plan).
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { differenceTone, formatCOP } from "../utils/cash.utils";
import { useSessionsHistory } from "../hooks/useCash";
import type { CashSession } from "../types/cash.types";

interface SessionsHistoryProps {
  businessId: string;
  branchId: string;
  onSelectSession?: (session: CashSession & { register: { id: string; name: string } }) => void;
}

export function SessionsHistory({ businessId, branchId, onSelectSession }: SessionsHistoryProps) {
  const t = useTranslations("cash");
  const [onlyWithDifference, setOnlyWithDifference] = useState(false);
  const { data, isLoading } = useSessionsHistory(businessId, branchId, {
    page: 1,
    limit: 50,
  });

  const items = (data?.items ?? []).filter((session) =>
    onlyWithDifference ? Number(session.difference ?? 0) !== 0 : true
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">{t("sessions.history")}</CardTitle>
        <div className="flex items-center gap-2">
          <label htmlFor="cash-only-difference" className="text-xs text-slate-500">
            {t("sessions.onlyWithDifference")}
          </label>
          <Switch
            id="cash-only-difference"
            checked={onlyWithDifference}
            onCheckedChange={setOnlyWithDifference}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="py-4 text-center text-sm text-slate-500">…</p>
        ) : items.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">{t("sessions.noHistory")}</p>
        ) : (
          <ul className="divide-y">
            {items.map((session) => {
              const { tone } = differenceTone(session.difference);
              return (
                <li key={session.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 py-2 text-left hover:bg-slate-50"
                    onClick={() => onSelectSession?.(session)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{session.register.name}</p>
                      <p className="text-xs text-slate-500">
                        {session.closedAt
                          ? new Date(session.closedAt).toLocaleString("es-CO")
                          : "—"}
                      </p>
                    </div>
                    {tone === "exact" ? (
                      <Badge variant="secondary">{t("sessions.exact")}</Badge>
                    ) : (
                      <Badge variant={tone === "shortage" ? "destructive" : "default"}>
                        {tone === "shortage" ? t("sessions.shortage") : t("sessions.surplus")}:{" "}
                        {formatCOP(session.difference ?? 0)}
                      </Badge>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

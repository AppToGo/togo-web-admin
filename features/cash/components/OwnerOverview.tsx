"use client";
/**
 * Vista dueño: por sede, efectivo esperado en cajas abiertas, por liquidar
 * y quién está en turno. Tarjetas `metrics-*` como los KPIs del sistema.
 * Usa el endpoint de negocio (`cash.view`); la sede es dato, no scope.
 */
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { categoryBadgeVariants } from "@/features/orders/styles";
import { formatCOP } from "../utils/cash.utils";
import { useOwnerOverview } from "../hooks/useCash";

export function OwnerOverview({ businessId }: { businessId: string }) {
  const t = useTranslations("cash");
  const { data: branches = [], isLoading } = useOwnerOverview(businessId);

  if (isLoading) return <p className="py-8 text-center text-sm text-slate-500">…</p>;
  if (branches.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">{t("overview.noOpen")}</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {branches.map((row) => {
        const openCount = row.openSessions.length;
        const expected = row.openSessions.reduce(
          (acc, session) => acc + Number(session.expectedAmount),
          0
        );
        const owners = [
          ...new Set(
            row.openSessions
              .map((session) => session.openedByName)
              .filter((name): name is string => !!name)
          ),
        ];
        return (
          <Card
            key={row.branch.id}
            variant={openCount > 0 ? "metrics-emerald" : "metrics-amber"}
          >
            <CardContent className="space-y-3 p-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-slate-900">
                  {row.branch.name}
                </h2>
                <span
                  className={cn(
                    categoryBadgeVariants({ variant: openCount > 0 ? "green" : "amber" }),
                    "text-xs"
                  )}
                >
                  {t("overview.openCount", { count: openCount })}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums text-slate-900">
                  {formatCOP(expected)}
                </p>
                <p className="text-xs text-slate-500">{t("overview.expectedOpen")}</p>
              </div>
              {row.openSessions.map((session) => (
                <div key={session.id} className="flex justify-between text-sm">
                  <span className="text-slate-600">
                    {session.register?.name ?? "—"}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatCOP(session.expectedAmount)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between border-t border-slate-300/50 pt-3 text-sm">
                <span className="font-medium text-amber-800">
                  {t("overview.pendingSettlement")}
                </span>
                <span className="font-semibold tabular-nums">
                  {t("overview.pendingRow", {
                    amount: formatCOP(row.pendingSettlement.total),
                    count: row.pendingSettlement.count,
                  })}
                </span>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-slate-600">{t("overview.responsibles")}</span>
                <span className="text-right font-medium">
                  {owners.length > 0 ? owners.join(" · ") : t("overview.nobody")}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

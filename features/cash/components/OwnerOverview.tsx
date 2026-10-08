"use client";
/**
 * Vista dueño: turnos abiertos de todas las sedes + por-liquidar global.
 * Usa el endpoint de negocio (`cash.view`); la sede se muestra como dato,
 * no como scope (el scope ya es el negocio del JWT).
 */
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCOP } from "../utils/cash.utils";
import { useOwnerOverview } from "../hooks/useCash";

export function OwnerOverview({ businessId }: { businessId: string }) {
  const t = useTranslations("cash");
  const { data: branches = [], isLoading } = useOwnerOverview(businessId);

  if (isLoading) return <p className="py-4 text-center text-sm text-slate-500">…</p>;
  if (branches.length === 0) {
    return <p className="py-4 text-center text-sm text-slate-500">{t("overview.noOpen")}</p>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {branches.map((row) => (
        <Card key={row.branch.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{row.branch.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {row.openSessions.length === 0 ? (
              <p className="text-sm text-slate-500">{t("overview.noOpen")}</p>
            ) : (
              row.openSessions.map((session) => (
                <div key={session.id} className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    {session.register?.name ?? session.cashRegisterId}
                  </span>
                  <span className="font-medium">
                    {formatCOP(session.expectedAmount)}
                  </span>
                </div>
              ))
            )}
            <div className="flex justify-between border-t pt-2 text-sm">
              <span className="text-slate-500">{t("overview.pendingSettlement")}</span>
              <span className="font-semibold">
                {row.pendingSettlement.count} · {formatCOP(row.pendingSettlement.total)}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

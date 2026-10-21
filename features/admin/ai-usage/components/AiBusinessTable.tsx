"use client";

import { useLocale, useTranslations } from "next-intl";
import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardCardHeader } from "@/features/dashboard/components/DashboardCardHeader";
import type { AiUsageByBusiness } from "@/types/ai-usage.types";
import {
  formatCount,
  formatUsd,
} from "@/features/admin/ai-usage/utils/ai-usage.utils";

/** Gasto por negocio, de mayor a menor. Una fila lleva al detalle del negocio. */
export function AiBusinessTable({
  rows,
  onSelect,
}: {
  rows: AiUsageByBusiness[];
  onSelect: (row: AiUsageByBusiness) => void;
}) {
  const t = useTranslations("admin-ai-usage");
  const locale = useLocale();

  return (
    <Card variant="glass">
      <DashboardCardHeader
        icon={Building2}
        title={t("businesses.title")}
        subtitle={t("businesses.subtitle")}
      />
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {t("empty")}
          </p>
        ) : (
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-2 pb-2 font-medium">
                    {t("businesses.business")}
                  </th>
                  <th className="px-2 pb-2 text-right font-medium">
                    {t("businesses.cost")}
                  </th>
                  <th className="px-2 pb-2 text-right font-medium">
                    {t("businesses.calls")}
                  </th>
                  <th className="px-2 pb-2 text-right font-medium">
                    {t("businesses.orders")}
                  </th>
                  <th className="px-2 pb-2 text-right font-medium">
                    {t("businesses.perOrder")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  // Sin nombre = el negocio se borró; su consumo sigue siendo suyo.
                  const name = row.businessId
                    ? (row.businessName ?? t("businesses.deleted"))
                    : t("businesses.platform");
                  return (
                    <tr key={row.businessId ?? "platform"}>
                      <td className="px-2 py-2.5">
                        {row.businessId ? (
                          <button
                            type="button"
                            onClick={() => onSelect(row)}
                            className="text-left font-medium text-slate-900 hover:text-indigo-600 hover:underline"
                          >
                            {name}
                          </button>
                        ) : (
                          <span className="text-slate-500">{name}</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                        {formatUsd(row.costUsd, locale)}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-slate-600">
                        {formatCount(row.calls, locale)}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-slate-600">
                        {formatCount(row.orders, locale)}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-slate-600">
                        {formatUsd(row.costPerOrderUsd, locale)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

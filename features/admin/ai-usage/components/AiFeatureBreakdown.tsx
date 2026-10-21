"use client";

import { useLocale, useTranslations } from "next-intl";
import { Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardCardHeader } from "@/features/dashboard/components/DashboardCardHeader";
import type { AiUsageByFeature } from "@/types/ai-usage.types";
import { formatUsd } from "@/features/admin/ai-usage/utils/ai-usage.utils";

/** En qué se va el gasto: una barra por función, de mayor a menor. */
export function AiFeatureBreakdown({ rows }: { rows: AiUsageByFeature[] }) {
  const t = useTranslations("admin-ai-usage");
  const locale = useLocale();
  const total = rows.reduce((sum, row) => sum + row.costUsd, 0);

  return (
    <Card variant="glass" className="h-full">
      <DashboardCardHeader
        icon={Layers}
        title={t("features.title")}
        subtitle={t("features.subtitle")}
      />
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {t("empty")}
          </p>
        ) : (
          <ul className="space-y-3.5">
            {rows.map((row) => {
              const share = total > 0 ? (row.costUsd / total) * 100 : 0;
              return (
                <li key={row.feature}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-slate-700">
                      {t(`features.names.${row.feature}`)}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                      {formatUsd(row.costUsd, locale)}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"
                    role="presentation"
                  >
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${Math.max(share, 1)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {t("features.share", {
                      share: Math.round(share),
                      count: row.calls,
                    })}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useLocale, useTranslations } from "next-intl";
import { Cpu } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardCardHeader } from "@/features/dashboard/components/DashboardCardHeader";
import type { AiUsageByModel } from "@/types/ai-usage.types";
import {
  formatCount,
  formatUsd,
} from "@/features/admin/ai-usage/utils/ai-usage.utils";

/** Gasto y tokens por modelo de OpenAI. */
export function AiModelList({ rows }: { rows: AiUsageByModel[] }) {
  const t = useTranslations("admin-ai-usage");
  const locale = useLocale();

  return (
    <Card variant="glass" className="h-full">
      <DashboardCardHeader icon={Cpu} title={t("models.title")} />
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {t("empty")}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((row) => (
              <li
                key={row.model}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-[13px] text-slate-900">
                    {row.model}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t("models.tokens", {
                      input: formatCount(row.inputTokens, locale),
                      output: formatCount(row.outputTokens, locale),
                    })}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                  {formatUsd(row.costUsd, locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useLocale, useTranslations } from "next-intl";
import { Scale } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardCardHeader } from "@/features/dashboard/components/DashboardCardHeader";
import type { AiUsageIntentByModel } from "@/types/ai-usage.types";
import {
  formatCount,
  formatUsd,
} from "@/features/admin/ai-usage/utils/ai-usage.utils";

type NumericKey =
  | "costPerCallUsd"
  | "cachedInputShare"
  | "p50LatencyMs"
  | "avgConfidence"
  | "lowConfidenceShare";

/** Qué es mejor en cada columna: más alto o más bajo. */
const BETTER: Record<NumericKey, "low" | "high"> = {
  costPerCallUsd: "low",
  cachedInputShare: "high",
  p50LatencyMs: "low",
  avgConfidence: "high",
  lowConfidenceShare: "low",
};

/** Modelo con el mejor valor de la columna; null con un solo modelo o empate. */
function bestModel(
  rows: AiUsageIntentByModel[],
  key: NumericKey
): string | null {
  const values = rows.filter((row) => row[key] !== null);
  if (values.length < 2) return null;
  const sorted = [...values].sort((a, b) =>
    BETTER[key] === "low"
      ? (a[key] as number) - (b[key] as number)
      : (b[key] as number) - (a[key] as number)
  );
  return sorted[0][key] === sorted[1][key] ? null : sorted[0].model;
}

function formatShare(value: number | null, locale: string): string {
  return value === null ? "–" : `${formatCount(value * 100, locale, 1)}%`;
}

function formatSeconds(value: number | null, locale: string): string {
  return value === null ? "–" : `${formatCount(value / 1000, locale, 2)} s`;
}

/**
 * Clasificador de intenciones por modelo: el principal (gpt-4o-mini) contra
 * el alternativo que usan los negocios con el flag LLM_INTENT_ALT_MODEL.
 * Resalta el mejor de cada columna para decidir con cuál quedarse.
 */
export function AiIntentModelTable({
  rows,
}: {
  rows: AiUsageIntentByModel[];
}) {
  const t = useTranslations("admin-ai-usage");
  const locale = useLocale();

  const best = Object.fromEntries(
    (Object.keys(BETTER) as NumericKey[]).map((key) => [
      key,
      bestModel(rows, key),
    ])
  ) as Record<NumericKey, string | null>;

  // Ahorro por llamada del más barato frente al más caro.
  const priced = rows
    .filter((row) => row.costPerCallUsd)
    .sort((a, b) => a.costPerCallUsd! - b.costPerCallUsd!);
  const cheapest = priced[0];
  const priciest = priced[priced.length - 1];
  const savings =
    priced.length > 1 && cheapest.costPerCallUsd! < priciest.costPerCallUsd!
      ? 1 - cheapest.costPerCallUsd! / priciest.costPerCallUsd!
      : null;

  const cell = (row: AiUsageIntentByModel, key: NumericKey, text: string) => (
    <td
      className={`px-2 py-2.5 text-right tabular-nums ${
        best[key] === row.model
          ? "font-semibold text-emerald-700"
          : "text-slate-600"
      }`}
    >
      {text}
    </td>
  );

  return (
    <Card variant="glass">
      <DashboardCardHeader
        icon={Scale}
        title={t("intentModels.title")}
        subtitle={t("intentModels.subtitle")}
      />
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {t("empty")}
          </p>
        ) : (
          <>
            <div className="-mx-2 overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500">
                    <th className="px-2 pb-2 font-medium">
                      {t("intentModels.model")}
                    </th>
                    <th className="px-2 pb-2 text-right font-medium">
                      {t("intentModels.calls")}
                    </th>
                    <th className="px-2 pb-2 text-right font-medium">
                      {t("intentModels.perCall")}
                    </th>
                    <th className="px-2 pb-2 text-right font-medium">
                      {t("intentModels.per1k")}
                    </th>
                    <th className="px-2 pb-2 text-right font-medium">
                      {t("intentModels.cached")}
                    </th>
                    <th className="px-2 pb-2 text-right font-medium">
                      {t("intentModels.latency")}
                    </th>
                    <th className="px-2 pb-2 text-right font-medium">
                      {t("intentModels.confidence")}
                    </th>
                    <th
                      className="px-2 pb-2 text-right font-medium"
                      title={t("intentModels.lowConfidenceHint")}
                    >
                      {t("intentModels.lowConfidence")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row.model}>
                      <td className="px-2 py-2.5 font-mono text-[13px] text-slate-900">
                        {row.model}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-slate-600">
                        {formatCount(row.calls, locale)}
                      </td>
                      {cell(
                        row,
                        "costPerCallUsd",
                        formatUsd(row.costPerCallUsd, locale)
                      )}
                      <td className="px-2 py-2.5 text-right tabular-nums text-slate-600">
                        {formatUsd(
                          row.costPerCallUsd === null
                            ? null
                            : row.costPerCallUsd * 1000,
                          locale
                        )}
                      </td>
                      {cell(
                        row,
                        "cachedInputShare",
                        formatShare(row.cachedInputShare, locale)
                      )}
                      {cell(
                        row,
                        "p50LatencyMs",
                        `${formatSeconds(row.p50LatencyMs, locale)} · ${formatSeconds(row.p90LatencyMs, locale)}`
                      )}
                      {cell(
                        row,
                        "avgConfidence",
                        row.avgConfidence === null
                          ? "–"
                          : formatCount(row.avgConfidence, locale, 2)
                      )}
                      {cell(
                        row,
                        "lowConfidenceShare",
                        formatShare(row.lowConfidenceShare, locale)
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500">
              {savings !== null
                ? t("intentModels.savings", {
                    cheaper: cheapest.model,
                    other: priciest.model,
                    share: formatCount(savings * 100, locale),
                  })
                : rows.length === 1
                  ? t("intentModels.single")
                  : null}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/features/dashboard/components/loading/CardSkeleton";
import { useDateFilterRange } from "@/features/filters/stores/date-filter.store";
import { useAiUsageSummary } from "@/features/admin/ai-usage/hooks/useAiUsage";
import { AiUsageKpis } from "./AiUsageKpis";
import { AiCostChart } from "./AiCostChart";
import { AiFeatureBreakdown } from "./AiFeatureBreakdown";

/**
 * Consumo de IA en el dashboard, solo para SUPER_ADMIN: del negocio elegido
 * en el selector, o de todos si no hay uno. Usa el mismo rango de fechas
 * del dashboard. Quien la monta decide si el usuario la puede ver.
 */
export function AiUsageSection({
  businessId,
  businessName,
}: {
  /** null = todos los negocios. */
  businessId: string | null;
  businessName?: string;
}) {
  const t = useTranslations("admin-ai-usage");
  const range = useDateFilterRange();
  const { data, isLoading, isError, refetch } = useAiUsageSummary({
    from: range.from,
    to: range.to,
    ...(businessId ? { businessId } : {}),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Sparkles className="h-5 w-5 text-indigo-600" aria-hidden />
          {t("section.title")}
        </h2>
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          {t("section.superAdminOnly")}
        </span>
        <span className="text-sm text-slate-500">
          ·{" "}
          {businessId
            ? (businessName ?? t("section.selectedBusiness"))
            : t("section.allBusinesses")}
        </span>
      </div>

      {isError ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t("error")}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            {t("retry")}
          </Button>
        </div>
      ) : (
        <>
          <AiUsageKpis totals={data?.totals} isLoading={isLoading} />
          {isLoading || !data ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <CardSkeleton className="h-96 lg:col-span-2" />
              <CardSkeleton className="h-96" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <AiCostChart
                  daily={data.daily}
                  totalUsd={data.totals.costUsd}
                />
              </div>
              <AiFeatureBreakdown rows={data.byFeature} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

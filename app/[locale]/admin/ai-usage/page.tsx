"use client";

/**
 * Consumo de IA de todos los negocios (solo SUPER_ADMIN): lo que cuesta
 * OpenAI en USD, por día, por función, por modelo y por negocio. Elegir un
 * negocio de la tabla filtra toda la pantalla.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw, Sparkles, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useIsSuperAdmin } from "@/features/auth/stores/auth.store";
import { Button } from "@/components/ui/button";
import { DateRangeFilter } from "@/features/filters/components";
import { useDateFilterRange } from "@/features/filters/stores/date-filter.store";
import { CardSkeleton } from "@/features/dashboard/components/loading/CardSkeleton";
import { useAiUsageSummary } from "@/features/admin/ai-usage/hooks/useAiUsage";
import { AiUsageKpis } from "@/features/admin/ai-usage/components/AiUsageKpis";
import { AiCostChart } from "@/features/admin/ai-usage/components/AiCostChart";
import { AiFeatureBreakdown } from "@/features/admin/ai-usage/components/AiFeatureBreakdown";
import { AiBusinessTable } from "@/features/admin/ai-usage/components/AiBusinessTable";
import { AiModelList } from "@/features/admin/ai-usage/components/AiModelList";
import { usePlatformPermission } from "@/features/auth/hooks/usePlatformPermission";

export default function AdminAiUsagePage() {
  const t = useTranslations("admin-ai-usage");
  const { isLoading: isAuthLoading } = useAuthGuard();
  // Personal de ToGo con permiso para esta sección (el SUPER_ADMIN siempre)
  const { allowed: canAccessSection, isLoading: isPermissionLoading } =
    usePlatformPermission("platform.ai_usage.view");
  const isSuperAdmin = useIsSuperAdmin() && canAccessSection;
  const range = useDateFilterRange();
  const [business, setBusiness] = useState<{ id: string; name: string } | null>(
    null
  );

  const { data, isLoading, isError, refetch } = useAiUsageSummary(
    {
      from: range.from,
      to: range.to,
      ...(business ? { businessId: business.id } : {}),
    },
    isSuperAdmin
  );

  if (isAuthLoading || isPermissionLoading) return null;

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <p className="text-sm text-slate-500">{t("accessDenied")}</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 lg:space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          {/* < lg el nombre de la sección ya está en la barra superior. */}
          <div className="hidden lg:block">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Sparkles className="h-6 w-6 text-indigo-600" aria-hidden />
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
          </div>
          <DateRangeFilter
            variant="default"
            showPresets={true}
            availablePresets={[
              "today",
              "yesterday",
              "week",
              "last7days",
              "month",
              "custom",
            ]}
          />
        </div>

        {business && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{t("filteredBy")}</span>
            <button
              type="button"
              onClick={() => setBusiness(null)}
              className="flex h-9 items-center gap-2 rounded-full border border-indigo-600 bg-indigo-600 px-3.5 text-[13px] font-semibold text-white"
              aria-label={t("clearBusiness", { name: business.name })}
            >
              {business.name}
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )}

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
              <>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <AiCostChart
                      daily={data.daily}
                      totalUsd={data.totals.costUsd}
                    />
                  </div>
                  <AiFeatureBreakdown rows={data.byFeature} />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {!business && (
                    <div className="lg:col-span-2">
                      <AiBusinessTable
                        rows={data.byBusiness}
                        onSelect={(row) =>
                          row.businessId &&
                          setBusiness({
                            id: row.businessId,
                            name: row.businessName ?? row.businessId,
                          })
                        }
                      />
                    </div>
                  )}
                  <AiModelList rows={data.byModel} />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

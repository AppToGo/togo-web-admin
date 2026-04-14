"use client";

import { Suspense } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { useTranslations } from "next-intl";
import { DateRangeFilter } from "@/features/filters/components";
import { useDateFilterPreset } from "@/features/filters/stores";
import {
  KpiSection,
  KpiSectionSkeleton,
  LazyMetricsGrid,
  LazyChartsSection,
  BranchSelector,
} from "@/features/dashboard";
import { usePlanMetrics } from "@/features/dashboard/hooks/usePlanMetrics";
import { FreePlanBanner, useOpenUpgradePlanModal } from "@/features/subscription";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");

  useAuthGuard();

  const user = useCurrentUser();
  const currentPreset = useDateFilterPreset();
  const { config, planKey } = usePlanMetrics();
  const openUpgradeModal = useOpenUpgradePlanModal();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* PLG Free Plan Banner — shown when user is on free plan (plan 1) */}
        {user?.subscriptionPlan === 1 && <FreePlanBanner onUpgrade={openUpgradeModal} />}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {t("greeting", { name: user?.name || tc("empty.title") })}
            </h2>
            <p className="text-slate-500 mt-1">
              {user?.businessName ? (
                <>
                  {t("welcome.withBusiness", {
                    businessName: user.businessName,
                  })}
                </>
              ) : (
                t("welcome.withoutBusiness")
              )}
            </p>
            <p className="text-xs text-indigo-600 mt-1 font-medium">
              Plan: {planKey.toUpperCase()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <BranchSelector />
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
        </div>

        {/* KPIs - Carga inmediata con Suspense */}
        <Suspense fallback={<KpiSectionSkeleton />}>
          <KpiSection />
        </Suspense>

        {/* Metrics Grid - Lazy load (Basic+) */}
        {config.lazy.includes("payment-methods") && (
          <section>
            <h3 className="text-lg font-semibold mb-4">Métricas Detalladas</h3>
            <LazyMetricsGrid />
          </section>
        )}

        {/* Charts - Lazy load (Pro+) */}
        {config.lazy.includes("revenue-chart") && (
          <section>
            <h3 className="text-lg font-semibold mb-4">Análisis</h3>
            <LazyChartsSection />
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

"use client";

import { Suspense } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { useTranslations } from "next-intl";
import { DateRangeFilter } from "@/features/filters/components";
import {
  KpiSection,
  KpiSectionSkeleton,
  LazyMetricsGrid,
  LazyChartsSection,
  BranchSelector,
} from "@/features/dashboard";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");

  useAuthGuard();

  const user = useCurrentUser();

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">
              {t("greeting", { name: user?.name || tc("empty.title") })}
            </h2>
            {/* En el teléfono el saludo basta: la bienvenida ocupa media pantalla. */}
            <p className="hidden md:block text-slate-500 mt-1">
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
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
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

        {/* Metrics Grid - Lazy load */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Métricas Detalladas</h3>
          <LazyMetricsGrid />
        </section>

        {/* Charts - Lazy load */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Análisis</h3>
          <LazyChartsSection />
        </section>
      </div>
    </DashboardLayout>
  );
}

"use client";

import { Suspense } from "react";
import { LayoutDashboard } from "lucide-react";
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6 text-indigo-600" />
              {t("title")}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              {t("greeting", { name: user?.name || tc("empty.title") })}{" "}
              {user?.businessName
                ? t("welcome.withBusiness", {
                    businessName: user.businessName,
                  })
                : t("welcome.withoutBusiness")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
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
        <section aria-label={t("sections.kpis")}>
          <Suspense fallback={<KpiSectionSkeleton />}>
            <KpiSection />
          </Suspense>
        </section>

        {/* Ingresos + métodos de pago - Lazy load */}
        <section aria-label={t("sections.detail")}>
          <LazyMetricsGrid />
        </section>

        {/* Embudo + horas pico - Lazy load */}
        <section aria-label={t("sections.analysis")}>
          <LazyChartsSection />
        </section>
      </div>
    </DashboardLayout>
  );
}

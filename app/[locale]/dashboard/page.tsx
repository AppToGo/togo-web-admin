"use client";

import { Suspense } from "react";
import { LayoutDashboard } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import {
  useCurrentUser,
  useIsSuperAdmin,
} from "@/features/auth/stores/auth.store";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { useBusinesses } from "@/features/orders/hooks/useOrders";
import { AiUsageSection } from "@/features/admin/ai-usage/components/AiUsageSection";
import { WhatsAppUsageChart } from "@/features/whatsapp";
import { useTranslations } from "next-intl";
import { DateRangeFilter } from "@/features/filters/components";
import {
  KpiSection,
  KpiSectionSkeleton,
  LazyMetricsGrid,
  LazyChartsSection,
  LazyProductsSection,
  LazyCatalogSection,
  ProductReviewsCard,
  SurveyCard,
  ProductsSectionSkeleton,
  BranchSelector,
} from "@/features/dashboard";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import { Feature } from "@/features/business-features";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");

  useAuthGuard();

  const user = useCurrentUser();
  const isSuperAdmin = useIsSuperAdmin();
  // Mismo permiso que el endpoint de estadísticas de productos. Mientras
  // cargan los permisos se reserva el espacio (skeleton) para que la
  // sección no aparezca de golpe y empuje lo de abajo.
  const { hasPermission, isLoading: permissionsLoading } = useMyPermissions();
  const canViewProducts = hasPermission("metrics.view");
  const canViewReviews = hasPermission("product.view");
  // Negocio del selector (SUPER_ADMIN) o el propio; "" = todos los negocios.
  const aiBusinessId = useEffectiveBusinessId() || null;
  const { data: businesses } = useBusinesses({
    enabled: isSuperAdmin && !!aiBusinessId,
  });
  const aiBusinessName = businesses?.find((b) => b.id === aiBusinessId)?.name;
  const businessName = isSuperAdmin ? aiBusinessName : user?.businessName;
  // Las estadísticas son de un negocio: con "Todos" no hay qué consultar.
  const needsBusiness = isSuperAdmin && !aiBusinessId;

  return (
    <DashboardLayout>
      <RequirePermission code="metrics.view">
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" />
              {t("title")}
            </h1>
            {/* En el teléfono el título basta: la bienvenida ocupa media pantalla. */}
            <p className="hidden md:block text-slate-500 mt-1 text-sm">
              {t("greeting", { name: user?.name || tc("empty.title") })}{" "}
              {businessName
                ? t("welcome.withBusiness", {
                    businessName,
                  })
                : t("welcome.withoutBusiness")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3 shrink-0">
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

        {needsBusiness ? (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {t("selectBusiness")}
          </p>
        ) : (
        <>
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

        {/* Más vendidos, tendencias y sin ventas - Lazy load */}
        {permissionsLoading ? (
          <ProductsSectionSkeleton />
        ) : (
          canViewProducts && (
            <section aria-label={t("sections.products")}>
              <LazyProductsSection />
            </section>
          )
        )}

        {/* Analítica del catálogo web: vistos, búsquedas, embudo - Lazy load */}
        {canViewProducts && (
          <Feature name="CATALOG_ANALYTICS">
            <section aria-label={t("sections.catalog")}>
              <LazyCatalogSection />
            </section>
          </Feature>
        )}

        {/* Encuesta de satisfacción y calificaciones de los clientes (mismo permiso que el endpoint) */}
        {canViewReviews && (
          <Feature name="PRODUCT_REVIEWS">
            <section aria-label={t("sections.reviews")} className="space-y-4 md:space-y-6">
              <SurveyCard />
              <ProductReviewsCard />
            </section>
          </Feature>
        )}

        {/* Embudo + horas pico - Lazy load */}
        <section aria-label={t("sections.analysis")}>
          <LazyChartsSection />
        </section>

        {/* Consumo de WhatsApp del mes (gratis vs cobrados), en vivo */}
        <section aria-label={t("sections.whatsappUsage")}>
          <WhatsAppUsageChart />
        </section>
        </>
        )}

        {isSuperAdmin && (
          <section aria-label={t("sections.aiUsage")}>
            <AiUsageSection
              businessId={aiBusinessId}
              businessName={aiBusinessName}
            />
          </section>
        )}
      </div>
      </RequirePermission>
    </DashboardLayout>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { Filter, Lock, Store } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import {
  useHasBusiness,
  useIsSuperAdmin,
} from "@/features/auth/stores/auth.store";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { DateRangeFilter } from "@/features/filters/components";
import { useDateFilterRange } from "@/features/filters/stores";
import {
  ConversationFunnelSkeleton,
  ConversationFunnelView,
} from "@/features/conversations";

/**
 * Embudo conversacional del bot (plan bot natural, T20): cuántas
 * conversaciones terminan en pedido, dónde se abandonan y qué tan bien
 * entiende el bot, en el período elegido.
 */
export default function ConversationFunnelPage() {
  const t = useTranslations("conversations.funnel");

  useAuthGuard();
  const hasBusiness = useHasBusiness();
  const isSuperAdmin = useIsSuperAdmin();
  const selectedBusinessId = useEffectiveBusinessId();
  const { hasPermission, isLoading: permissionsLoading } = useMyPermissions();
  const range = useDateFilterRange();

  // Mismo permiso que el endpoint (metrics.view) y que la entrada del
  // Sidebar; el backend responde 403 igual si no lo tiene.
  const canView = hasPermission("metrics.view");

  if (!hasBusiness && !isSuperAdmin) {
    return (
      <DashboardLayout>
        <EmptyState icon={<Store className="w-8 h-8 text-amber-500" />}>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {t("page.title")}
          </h2>
        </EmptyState>
      </DashboardLayout>
    );
  }

  if (permissionsLoading) {
    return (
      <DashboardLayout>
        <ConversationFunnelSkeleton />
      </DashboardLayout>
    );
  }

  if (!canView) {
    return (
      <DashboardLayout>
        <EmptyState icon={<Lock className="w-8 h-8 text-slate-400" />}>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {t("page.accessDeniedTitle")}
          </h2>
          <p className="text-slate-500 text-center max-w-md">
            {t("page.accessDeniedDescription")}
          </p>
        </EmptyState>
      </DashboardLayout>
    );
  }

  // Sin negocio concreto: "Todos los negocios" ("") o un SUPER_ADMIN que
  // todavía no eligió ninguno (null). El endpoint es por negocio.
  if (!selectedBusinessId) {
    return (
      <DashboardLayout>
        <EmptyState icon={<Store className="w-8 h-8 text-indigo-500" />}>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {t("page.selectBusinessTitle")}
          </h2>
          <p className="text-slate-500 text-center max-w-md">
            {t("page.selectBusinessDescription")}
          </p>
        </EmptyState>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Filter className="h-6 w-6 text-indigo-600" />
              {t("page.title")}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">{t("page.subtitle")}</p>
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

        <ConversationFunnelView
          params={{ dateFrom: range.from, dateTo: range.to }}
        />
      </div>
    </DashboardLayout>
  );
}

function EmptyState({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
        {icon}
      </div>
      {children}
    </div>
  );
}

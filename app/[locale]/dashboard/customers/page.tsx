"use client";

import { Suspense, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { DateRangeFilter } from "@/features/filters/components";
import {
  useDateFilterStore,
  useDateFilterPreset,
} from "@/features/filters/stores";
import { useDateFilterParams } from "@/features/filters/hooks";
import { CustomersTable, TopCustomersCharts } from "@/features/customers";
import { useCustomers } from "@/features/customers";
import {
  useHasBusiness,
  useIsSuperAdmin,
} from "@/features/auth/stores/auth.store";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Store } from "lucide-react";
import { useTranslations } from "next-intl";

function CustomersLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-start">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Charts skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border border-slate-200">
        <div className="p-4">
          <Skeleton className="h-8 w-full" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 border-t border-slate-100">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const t = useTranslations("customers");
  const tc = useTranslations("common");

  useAuthGuard();
  const hasBusiness = useHasBusiness();
  const isSuperAdmin = useIsSuperAdmin();
  const selectedBusinessId = useEffectiveBusinessId();

  // Filtros globales de fecha
  const dateParams = useDateFilterParams();
  const datePreset = useDateFilterPreset();

  // Estado local de paginación
  const [page, setPage] = useState(1);
  const limit = 10;

  // Query de clientes
  const {
    data: customers,
    pagination,
    isLoading,
  } = useCustomers({
    page,
    limit,
    businessId: selectedBusinessId || undefined,
  });

  // Para usuarios normales sin negocio, mostrar error
  if (!hasBusiness && !isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {t("noBusiness.title")}
          </h2>
          <p className="text-slate-500 text-center max-w-md mb-6">
            {t("noBusiness.description")}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 flex-1 min-h-0">
        {/* Header con título y filtro de fecha */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-indigo-600" />
              {t("title")}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">{t("subtitle")}</p>
          </div>

          <DateRangeFilter
            variant="default"
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

        {/* Top Customers Charts */}
        <Suspense fallback={<Skeleton className="h-80" />}>
          <TopCustomersCharts businessId={selectedBusinessId || undefined} />
        </Suspense>

        {/* Customers Table */}
        <div className="flex-1 min-h-0">
          <Suspense fallback={<CustomersLoading />}>
            <CustomersTable
              data={customers}
              isLoading={isLoading}
              pagination={pagination}
              onPageChange={setPage}
            />
          </Suspense>
        </div>
      </div>
    </DashboardLayout>
  );
}

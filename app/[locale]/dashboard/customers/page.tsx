"use client";

import { Suspense, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { DateRangeFilter } from "@/features/filters/components";
import { CustomersGrid, TopCustomersCharts } from "@/features/customers";
import { useCustomers } from "@/features/customers";
import {
  useHasBusiness,
  useIsSuperAdmin,
} from "@/features/auth/stores/auth.store";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { BranchSingleSelector } from "@/features/branches/components";
import { useEffectiveBranches } from "@/features/branches/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { PillGroup } from "@/components/ui/pill-group";

/** Orden de la lista (el servidor ordena; tocar el elegido lo quita). */
const SORTS = {
  recent: { sortBy: "lastOrderDate", sortOrder: "desc" },
  orders: { sortBy: "totalOrders", sortOrder: "desc" },
  spent: { sortBy: "totalSpent", sortOrder: "desc" },
} as const;
type CustomerSort = keyof typeof SORTS;

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

      {/* Cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-3xl bg-white/60" />
        ))}
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const t = useTranslations("customers");

  useAuthGuard();
  const hasBusiness = useHasBusiness();
  const isSuperAdmin = useIsSuperAdmin();
  const selectedBusinessId = useEffectiveBusinessId();

  // Estado local de paginación
  const [page, setPage] = useState(1);
  // Múltiplo de 2 y de 3: las columnas de tarjetas quedan completas.
  const limit = 12;

  const [sort, setSort] = useState<CustomerSort | null>(null);

  // Estado para sede seleccionada
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  // Hook de branches
  const { showBranchSelector, defaultBranchId } = useEffectiveBranches();

  // Sin selector visible se usa la sede por defecto (valor derivado, no un
  // efecto que copia el default al estado).
  const effectiveBranchId =
    !showBranchSelector && defaultBranchId ? defaultBranchId : selectedBranchId;

  // Query de clientes
  const {
    data: customers,
    pagination,
    isLoading,
  } = useCustomers({
    page,
    limit,
    ...(sort ? SORTS[sort] : {}),
    businessId: selectedBusinessId || undefined,
    branchId: effectiveBranchId || undefined,
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
      <div className="space-y-4 lg:space-y-6">
        {/* Header con título y filtro de fecha */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          {/* < lg el nombre de la sección ya está en la barra superior. */}
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-indigo-600" />
              {t("title")}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">{t("subtitle")}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:items-center">
            {showBranchSelector && (
              <BranchSingleSelector
                value={effectiveBranchId}
                onChange={setSelectedBranchId}
              />
            )}
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
        </div>

        {/* Orden de la lista (tocar el elegido lo quita) y total */}
        <div className="flex items-center gap-3">
          <PillGroup
            label={t("mobileSort.label")}
            value={sort}
            onChange={(key) => {
              setSort(sort === key ? null : key);
              setPage(1);
            }}
            options={(Object.keys(SORTS) as CustomerSort[]).map((key) => ({
              id: key,
              label: t(`mobileSort.${key}`),
            }))}
            appearance="glass"
            className="min-w-0"
          />
          {!isLoading && (
            <span className="ml-auto hidden shrink-0 text-sm text-slate-500 sm:inline">
              {t("count", { count: pagination.total })}
            </span>
          )}
        </div>

        <div className="grid grid-cols-6 gap-5">
          {/* Tarjetas de clientes */}
          <div className="col-span-6 lg:col-span-4">
            <Suspense fallback={<CustomersLoading />}>
              <CustomersGrid
                data={customers}
                isLoading={isLoading}
                pagination={pagination}
                onPageChange={setPage}
              />
            </Suspense>
          </div>
          {/* Top Customers Charts (pantallas grandes) */}
          <div className="hidden lg:col-span-2 lg:block">
            <Suspense fallback={<Skeleton className="h-80" />}>
              <TopCustomersCharts
                businessId={selectedBusinessId || undefined}
                branchId={effectiveBranchId || undefined}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

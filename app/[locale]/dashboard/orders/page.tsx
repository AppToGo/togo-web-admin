"use client";

import { Suspense, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { OrdersKanbanBoard, BranchMultiSelector } from "@/features/orders/components";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { DateRangeFilter } from "@/features/filters/components";
import {
  useDateFilterStore,
  useDateFilterPreset,
} from "@/features/filters/stores";
import { useDateFilterParams } from "@/features/filters/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  SearchIcon,
  LayoutGrid,
  List,
  X,
  Filter,
  Check,
  Clock,
  Home,
  Store,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ViewToggle } from "@/components/ui/view-toggle";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useHasBusiness,
  useIsSuperAdmin,
} from "@/features/auth/stores/auth.store";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { useUserBranches } from "@/features/orders/hooks";
import { useBranchStore } from "@/stores/branch.store";

type CardViewMode = "card" | "list";

function OrdersLoading() {
  return (
    <div className="h-[calc(100vh-140px)]">
      {/* Header skeleton */}
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Main content skeleton */}
      <div className="glass rounded-card-xl p-6 h-full">
        <div className="flex gap-5 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-75 shrink-0">
              <Skeleton className="h-12 w-full rounded-card mb-3" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-36 w-full rounded-card" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const t = useTranslations("orders");
  const tc = useTranslations("common");

  useAuthGuard();
  const hasBusiness = useHasBusiness();
  const isSuperAdmin = useIsSuperAdmin();
  const selectedBusinessId = useEffectiveBusinessId();

  // Filtros globales de fecha
  const dateParams = useDateFilterParams();
  const datePreset = useDateFilterPreset();
  const { range: dateRange } = useDateFilterStore();

  const [cardViewMode, setCardViewMode] = useState<CardViewMode>("card");
  const [searchQuery, setSearchQuery] = useState("");

  // Filtros adicionales (locales)
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<{
    paid: boolean;
    pending: boolean;
  }>({ paid: true, pending: true });

  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<{
    delivery: boolean;
    pickup: boolean;
  }>({ delivery: true, pickup: true });

  // Verificar si hay filtros activos
  const isCustomDate = datePreset === "custom";
  const hasPaymentFilter =
    !paymentStatusFilter.paid || !paymentStatusFilter.pending;
  const hasDeliveryFilter =
    !deliveryTypeFilter.delivery || !deliveryTypeFilter.pickup;
  const hasAnyFilter = isCustomDate || hasPaymentFilter || hasDeliveryFilter;

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setPaymentStatusFilter({ paid: true, pending: true });
    setDeliveryTypeFilter({ delivery: true, pickup: true });
    // Resetear a "today" si está en custom
    if (datePreset === "custom") {
      useDateFilterStore.getState().setPreset("today");
    }
  };

  // Contar filtros activos (solo los locales, el de fecha global es siempre "activo")
  const activeFiltersCount = [
    hasPaymentFilter,
    hasDeliveryFilter,
    isCustomDate,
  ].filter(Boolean).length;

  // Get user branches info for access validation
  const { branches, isLoading: isLoadingBranches } = useUserBranches();
  const selectedBranchIds = useBranchStore((state) => state.selectedBranchIds);
  
  // Show branch selector only if user has access to multiple branches
  const showBranchSelector = branches.length > 1;

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

  // Para usuarios sin acceso a ninguna sucursal, mostrar error
  // SUPER_ADMIN puede operar sin sucursales inicialmente (seleccionan negocio primero)
  if (!isLoadingBranches && branches.length === 0 && !isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {t("noBranches.title")}
          </h2>
          <p className="text-slate-500 text-center max-w-md mb-6">
            {t("noBranches.description")}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 flex-1 min-h-0">
        {/* Header con título, buscador, filtro de fecha y toggle de vista */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
            <p className="text-slate-500 mt-1 text-sm">{t("subtitle")}</p>
          </div>

          {/* Controles: Branch Selector, Buscador, filtro de fecha y toggle de vista */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">

              {/* Buscador */}
              <div className="flex items-center bg-white rounded-card px-4 py-2.5 w-full sm:w-auto sm:min-w-64">
                <SearchIcon className="w-4 h-4 text-slate-400 mr-3" />
                <input
                  type="text"
                  placeholder={t("search.placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full"
                />
              </div>
              {/* Branch Multi Selector - only show when applicable */}
              {showBranchSelector && <BranchMultiSelector />}

              {/* Botón de filtros adicionales */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "relative flex items-center justify-center w-10 h-10 rounded-card transition-all duration-200",
                      hasAnyFilter
                        ? "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                        : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                    title={tc("buttons.filter")}
                  >
                    <Filter className="w-4 h-4" />
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-auto p-0 overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-sm text-slate-900">
                      {t("filters.title")}
                    </h3>
                    {(hasPaymentFilter ||
                      hasDeliveryFilter ||
                      isCustomDate) && (
                      <button
                        onClick={() => {
                          setPaymentStatusFilter({ paid: true, pending: true });
                          setDeliveryTypeFilter({
                            delivery: true,
                            pickup: true,
                          });
                          if (datePreset === "custom") {
                            useDateFilterStore.getState().setPreset("today");
                          }
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        {tc("buttons.clearAll")}
                      </button>
                    )}
                  </div>

                  <div className="p-4 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Filtro global de fecha */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {t("filters.dateRange")}
                      </h4>
                      <DateRangeFilter
                        variant="compact"
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

                    {/* Separador */}
                    <div className="h-px bg-slate-100" />

                    {/* Filtro por estado de pago */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {t("filters.paymentStatus.title")}
                      </h4>
                      <div className="space-y-2">
                        <label className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                              <Check className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="text-sm text-slate-700 group-hover:text-slate-900">
                              {t("filters.paymentStatus.paid")}
                            </span>
                          </div>
                          <Switch
                            checked={paymentStatusFilter.paid}
                            onCheckedChange={(checked) =>
                              setPaymentStatusFilter((prev) => ({
                                ...prev,
                                paid: checked,
                              }))
                            }
                          />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                              <Clock className="w-4 h-4 text-amber-600" />
                            </div>
                            <span className="text-sm text-slate-700 group-hover:text-slate-900">
                              {t("filters.paymentStatus.pending")}
                            </span>
                          </div>
                          <Switch
                            checked={paymentStatusFilter.pending}
                            onCheckedChange={(checked) =>
                              setPaymentStatusFilter((prev) => ({
                                ...prev,
                                pending: checked,
                              }))
                            }
                          />
                        </label>
                      </div>
                    </div>

                    {/* Separador */}
                    <div className="h-px bg-slate-100" />

                    {/* Filtro por tipo de envío */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {t("filters.deliveryType.title")}
                      </h4>
                      <div className="space-y-2">
                        <label className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Home className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-sm text-slate-700 group-hover:text-slate-900">
                              {t("filters.deliveryType.delivery")}
                            </span>
                          </div>
                          <Switch
                            checked={deliveryTypeFilter.delivery}
                            onCheckedChange={(checked) =>
                              setDeliveryTypeFilter((prev) => ({
                                ...prev,
                                delivery: checked,
                              }))
                            }
                          />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                              <Store className="w-4 h-4 text-purple-600" />
                            </div>
                            <span className="text-sm text-slate-700 group-hover:text-slate-900">
                              {t("filters.deliveryType.pickup")}
                            </span>
                          </div>
                          <Switch
                            checked={deliveryTypeFilter.pickup}
                            onCheckedChange={(checked) =>
                              setDeliveryTypeFilter((prev) => ({
                                ...prev,
                                pickup: checked,
                              }))
                            }
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Toggle de vista de cards */}
              <ViewToggle
                value={cardViewMode}
                onChange={(value) => setCardViewMode(value as CardViewMode)}
                options={[
                  { value: "card", icon: LayoutGrid, title: t("view.card") },
                  { value: "list", icon: List, title: t("view.list") },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Orders Board */}
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Indicador de filtros activos */}
          {hasAnyFilter && (
            <div className="flex items-center justify-end gap-2 text-xs text-slate-500 mb-1.5">
              <span>
                {hasPaymentFilter && (
                  <span className="ml-2">
                    {paymentStatusFilter.paid &&
                      !paymentStatusFilter.pending &&
                      t("filters.activeFilters.paidOnly")}
                    {!paymentStatusFilter.paid &&
                      paymentStatusFilter.pending &&
                      t("filters.activeFilters.pendingOnly")}
                  </span>
                )}
                {hasDeliveryFilter && (
                  <span className="ml-2">
                    {deliveryTypeFilter.delivery &&
                      !deliveryTypeFilter.pickup &&
                      t("filters.activeFilters.deliveryOnly")}
                    {!deliveryTypeFilter.delivery &&
                      deliveryTypeFilter.pickup &&
                      t("filters.activeFilters.pickupOnly")}
                  </span>
                )}
              </span>
              <button
                onClick={clearAllFilters}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {t("filters.clear")}
              </button>
            </div>
          )}
          <Suspense fallback={<OrdersLoading />}>
            <OrdersKanbanBoard
              searchQuery={searchQuery}
              cardViewMode={cardViewMode}
              dateFrom={dateParams.dateFrom}
              dateTo={dateParams.dateTo}
              businessId={selectedBusinessId || undefined}
              branchIds={selectedBranchIds || undefined}
              paymentStatusFilter={paymentStatusFilter}
              deliveryTypeFilter={deliveryTypeFilter}
            />
          </Suspense>
        </div>
      </div>
    </DashboardLayout>
  );
}

"use client";

import { Suspense, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { OrdersKanbanBoard } from "@/features/orders/components";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { Skeleton } from "@/components/ui/skeleton";
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
  CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { IconToggle } from "@/components/ui/icon-toggle";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, DateRange } from "@/components/ui/calendar";
import {
  useHasBusiness,
  useIsSuperAdmin,
} from "@/features/auth/stores/auth.store";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";

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

// Obtener fecha de hoy en formato YYYY-MM-DD (usando zona horaria local)
function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Formatear fecha YYYY-MM-DD para mostrar al usuario (sin problemas de zona horaria)
// La fecha se interpreta como fecha local, no UTC
function formatDisplayDate(dateString: string): string {
  if (!dateString) return "";

  // Dividir la fecha YYYY-MM-DD
  const [year, month, day] = dateString.split("-").map(Number);

  // Crear fecha usando componentes locales (evita problemas de UTC)
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function OrdersPage() {
  useAuthGuard();
  const hasBusiness = useHasBusiness();
  const isSuperAdmin = useIsSuperAdmin();
  const selectedBusinessId = useEffectiveBusinessId();

  const [cardViewMode, setCardViewMode] = useState<CardViewMode>("card");
  const [searchQuery, setSearchQuery] = useState("");

  // Estados de filtros de fecha
  const [useDateRange, setUseDateRange] = useState(false);
  const [useTodayOnly, setUseTodayOnly] = useState(true);
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });

  // Convertir DateRange a strings para la API
  const dateFrom = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "";
  const dateTo = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : dateFrom;

  // Filtros adicionales
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<{
    paid: boolean;
    pending: boolean;
  }>({ paid: true, pending: true });

  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<{
    delivery: boolean;
    pickup: boolean;
  }>({ delivery: true, pickup: true });

  // Verificar si hay filtros activos
  const hasDateFilter = useDateRange || !useTodayOnly;
  const hasPaymentFilter =
    !paymentStatusFilter.paid || !paymentStatusFilter.pending;
  const hasDeliveryFilter =
    !deliveryTypeFilter.delivery || !deliveryTypeFilter.pickup;
  const hasAnyFilter = hasDateFilter || hasPaymentFilter || hasDeliveryFilter;

  // Limpiar filtros de fecha
  const clearDateFilter = () => {
    const today = new Date();
    setDateRange({ from: today, to: today });
    setUseTodayOnly(true);
    setUseDateRange(false);
  };

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    clearDateFilter();
    setPaymentStatusFilter({ paid: true, pending: true });
    setDeliveryTypeFilter({ delivery: true, pickup: true });
  };

  // Contar filtros activos
  const activeFiltersCount = [
    hasPaymentFilter,
    hasDeliveryFilter,
    dateFrom !== getTodayString() || dateTo !== getTodayString(),
  ].filter(Boolean).length;

  // Para usuarios normales sin negocio, mostrar error
  if (!hasBusiness && !isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            No tienes un negocio asignado
          </h2>
          <p className="text-slate-500 text-center max-w-md mb-6">
            Para ver las órdenes, necesitas tener un negocio asignado a tu
            cuenta. Contacta al administrador del sistema.
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
            <h1 className="text-2xl font-bold text-slate-900">
              Gestión de Órdenes
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Administra y supervisa todas las órdenes de tu negocio
            </p>
          </div>

          {/* Controles: Buscador, filtro de fecha y toggle de vista */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              {/* Buscador */}
              <div className="flex items-center bg-white rounded-card px-4 py-2.5 w-full sm:w-auto sm:min-w-64">
                <SearchIcon className="w-4 h-4 text-slate-400 mr-3" />
                <input
                  type="text"
                  placeholder="Buscar por orden, cliente, dirección, pago, tipo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full"
                />
              </div>

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
                    title="Filtros"
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
                      Filtros
                    </h3>
                    {(hasPaymentFilter ||
                      hasDeliveryFilter ||
                      hasDateFilter) && (
                      <button
                        onClick={() => {
                          setPaymentStatusFilter({ paid: true, pending: true });
                          setDeliveryTypeFilter({
                            delivery: true,
                            pickup: true,
                          });
                          clearDateFilter();
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Limpiar todo
                      </button>
                    )}
                  </div>

                  <div className="p-4 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Filtro por fecha - Solo hoy */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                        <CalendarDays className="w-3.5 h-3.5" />
                        Fecha
                      </h4>
                      <div className="space-y-2">
                        {/* Solo hoy */}
                        <label className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                useTodayOnly && !useDateRange
                                  ? "bg-indigo-100"
                                  : "bg-slate-100"
                              )}
                            >
                              <CalendarDays
                                className={cn(
                                  "w-4 h-4 transition-colors",
                                  useTodayOnly && !useDateRange
                                    ? "text-indigo-600"
                                    : "text-slate-600"
                                )}
                              />
                            </div>
                            <span className="text-sm text-slate-700 group-hover:text-slate-900">
                              Solo hoy
                            </span>
                          </div>
                          <Switch
                            checked={useTodayOnly && !useDateRange}
                            onCheckedChange={(checked) => {
                              setUseTodayOnly(checked);
                              if (checked) {
                                setUseDateRange(false);
                                const today = new Date();
                                setDateRange({ from: today, to: today });
                              }
                            }}
                          />
                        </label>

                        {/* Rango de fechas */}
                        <label className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                useDateRange ? "bg-indigo-100" : "bg-slate-100"
                              )}
                            >
                              <CalendarDays
                                className={cn(
                                  "w-4 h-4 transition-colors",
                                  useDateRange
                                    ? "text-indigo-600"
                                    : "text-slate-600"
                                )}
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-slate-700 group-hover:text-slate-900">
                                Rango de fechas
                              </span>
                              {useDateRange && dateRange?.from && (
                                <span className="text-xs text-slate-500">
                                  {format(dateRange.from, "dd MMM", {
                                    locale: es,
                                  })}
                                  {dateRange.to &&
                                    dateRange.to !== dateRange.from &&
                                    ` - ${format(dateRange.to, "dd MMM", { locale: es })}`}
                                </span>
                              )}
                            </div>
                          </div>
                          <Switch
                            checked={useDateRange}
                            onCheckedChange={(checked) => {
                              setUseDateRange(checked);
                              if (checked) {
                                setUseTodayOnly(false);
                                setShowCalendarDialog(true);
                              } else {
                                setUseTodayOnly(true);
                                const today = new Date();
                                setDateRange({ from: today, to: today });
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Separador */}
                    <div className="h-px bg-slate-100" />

                    {/* Filtro por estado de pago */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Estado de pago
                      </h4>
                      <div className="space-y-2">
                        <label className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                              <Check className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="text-sm text-slate-700 group-hover:text-slate-900">
                              Pagado
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
                              Pendiente
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
                        Tipo de envío
                      </h4>
                      <div className="space-y-2">
                        <label className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Home className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-sm text-slate-700 group-hover:text-slate-900">
                              A domicilio
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
                              Recoger en tienda
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
              <div className="flex items-center bg-white rounded-card p-1 shrink-0">
                <IconToggle
                  onClick={() => setCardViewMode("card")}
                  state={cardViewMode === "card" ? "active" : "inactive"}
                  title="Vista de tarjetas"
                >
                  <LayoutGrid className="w-4 h-4" />
                </IconToggle>
                <IconToggle
                  onClick={() => setCardViewMode("list")}
                  state={cardViewMode === "list" ? "active" : "inactive"}
                  title="Vista de lista"
                >
                  <List className="w-4 h-4" />
                </IconToggle>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Board */}
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Indicador de filtros activos */}
          {(hasDateFilter || hasAnyFilter) && (
            <div className="flex items-center justify-end gap-2 text-xs text-slate-500 mb-1.5">
              <span>
                Mostrando órdenes:{" "}
                {hasDateFilter ? (
                  <strong className="text-slate-700 ml-2">
                    {dateRange?.from &&
                      format(dateRange.from, "dd MMM", { locale: es })}
                    {dateRange?.to &&
                      dateRange.to !== dateRange.from &&
                      ` - ${format(dateRange.to, "dd MMM", { locale: es })}`}
                  </strong>
                ) : (
                  <strong className="text-slate-700 ml-2">Hoy</strong>
                )}
                {hasPaymentFilter && (
                  <span className="ml-2">
                    {paymentStatusFilter.paid &&
                      !paymentStatusFilter.pending &&
                      "• Solo pagadas"}
                    {!paymentStatusFilter.paid &&
                      paymentStatusFilter.pending &&
                      "• Solo pendientes"}
                  </span>
                )}
                {hasDeliveryFilter && (
                  <span className="ml-2">
                    {deliveryTypeFilter.delivery &&
                      !deliveryTypeFilter.pickup &&
                      "• A domicilio"}
                    {!deliveryTypeFilter.delivery &&
                      deliveryTypeFilter.pickup &&
                      "• Recoger en tienda"}
                  </span>
                )}
              </span>
              <button
                onClick={clearAllFilters}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Limpiar filtros
              </button>
            </div>
          )}
          <Suspense fallback={<OrdersLoading />}>
            <OrdersKanbanBoard
              searchQuery={searchQuery}
              cardViewMode={cardViewMode}
              dateFrom={dateFrom}
              dateTo={dateTo}
              businessId={selectedBusinessId || undefined}
              paymentStatusFilter={paymentStatusFilter}
              deliveryTypeFilter={deliveryTypeFilter}
            />
          </Suspense>
        </div>
      </div>

      {/* Dialog del calendario para seleccionar rango */}
      <Dialog open={showCalendarDialog} onOpenChange={setShowCalendarDialog}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Seleccionar rango de fechas</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            <Card className="border-0 shadow-none bg-transparent">
              <CardContent className="p-0 flex justify-center">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                />
              </CardContent>
            </Card>
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100/50">
              <div className="text-sm text-slate-600">
                {dateRange?.from ? (
                  dateRange?.to ? (
                    <>
                      <span className="font-medium text-slate-900">
                        {format(dateRange.from, "dd MMMM yyyy", { locale: es })}
                      </span>{" "}
                      hasta{" "}
                      <span className="font-medium text-slate-900">
                        {format(dateRange.to, "dd MMMM yyyy", { locale: es })}
                      </span>
                    </>
                  ) : (
                    <span className="font-medium text-slate-900">
                      {format(dateRange.from, "dd MMMM yyyy", { locale: es })}
                    </span>
                  )
                ) : (
                  "Selecciona un rango de fechas"
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const today = new Date();
                    setDateRange({ from: today, to: today });
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white/60 rounded-card transition-colors"
                >
                  Hoy
                </button>
                <button
                  onClick={() => setShowCalendarDialog(false)}
                  disabled={!dateRange?.from}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

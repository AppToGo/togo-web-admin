"use client";

import { Suspense, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { OrdersKanbanBoard } from "@/features/orders/components";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchIcon, LayoutGrid, List, Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconToggle } from "@/components/ui/icon-toggle";
import { IconButton } from "@/components/ui/icon-button";

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
  const [cardViewMode, setCardViewMode] = useState<CardViewMode>("card");
  const [searchQuery, setSearchQuery] = useState("");

  // Filtros de fecha - por defecto solo el día de hoy
  const [dateFrom, setDateFrom] = useState<string>(getTodayString());
  const [dateTo, setDateTo] = useState<string>(getTodayString());
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Verificar si hay filtro de fecha activo
  const hasDateFilter = dateFrom || dateTo;

  // Limpiar filtros de fecha
  const clearDateFilter = () => {
    setDateFrom(getTodayString());
    setDateTo(getTodayString());
  };

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
                  placeholder="Buscar órdenes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full"
                />
              </div>

              {/* Botón de filtro de fecha */}
              <div className="relative">
                <IconButton
                  onClick={() => setShowDateFilter(!showDateFilter)}
                  state={
                    showDateFilter || hasDateFilter ? "active" : "inactive"
                  }
                  title="Filtrar por fecha"
                >
                  <Calendar className="w-4 h-4" />
                </IconButton>

                {/* Dropdown de filtro de fecha */}
                {showDateFilter && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-card-lg shadow-card-lg border border-slate-100 p-4 z-50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-slate-900">
                        Filtrar por fecha
                      </h3>
                      <button
                        onClick={() => setShowDateFilter(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Desde
                        </label>
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Hasta
                        </label>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => {
                          clearDateFilter();
                          setShowDateFilter(false);
                        }}
                        className="flex-1 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        Hoy
                      </button>
                      <button
                        onClick={() => setShowDateFilter(false)}
                        className="flex-1 px-3 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}
              </div>

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

        {/* Orders Board - ocupa el resto del espacio */}
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Indicador de filtro activo */}
          {hasDateFilter && (
            <div className="flex items-center justify-end gap-2 text-xs text-slate-500 mb-1.5">
              <span>
                Mostrando órdenes:{" "}
                <strong className="text-slate-700 ml-2">
                  {dateFrom ? formatDisplayDate(dateFrom) : "Inicio"}
                  {dateFrom === dateTo
                    ? ""
                    : " - " + (dateTo ? formatDisplayDate(dateTo) : "Hoy")}
                </strong>
              </span>
              <button
                onClick={clearDateFilter}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Ver solo hoy
              </button>
            </div>
          )}
          <Suspense fallback={<OrdersLoading />}>
            <OrdersKanbanBoard
              searchQuery={searchQuery}
              cardViewMode={cardViewMode}
              dateFrom={dateFrom}
              dateTo={dateTo}
            />
          </Suspense>
        </div>
      </div>
    </DashboardLayout>
  );
}

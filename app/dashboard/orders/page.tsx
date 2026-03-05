"use client";

import { Suspense, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { OrdersKanbanBoard } from "@/features/orders/components";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchIcon, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

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
  useAuthGuard();
  const [cardViewMode, setCardViewMode] = useState<CardViewMode>("card");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 flex-1 min-h-0">
        {/* Header con título, buscador y toggle de vista */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Gestión de Órdenes
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Administra y supervisa todas las órdenes de tu negocio
            </p>
          </div>

          {/* Buscador y toggle de vista */}
          <div className="flex items-center gap-3">
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

            {/* Toggle de vista de cards */}
            <div className="flex items-center bg-white rounded-card p-1 shrink-0">
              <button
                onClick={() => setCardViewMode("card")}
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200",
                  cardViewMode === "card"
                    ? "bg-indigo-100 text-indigo-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                )}
                title="Vista de tarjetas"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCardViewMode("list")}
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200",
                  cardViewMode === "list"
                    ? "bg-indigo-100 text-indigo-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                )}
                title="Vista de lista"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Orders Board - ocupa el resto del espacio */}
        <div className="flex-1 min-h-0 flex flex-col">
          <Suspense fallback={<OrdersLoading />}>
            <OrdersKanbanBoard searchQuery={searchQuery} cardViewMode={cardViewMode} />
          </Suspense>
        </div>
      </div>
    </DashboardLayout>
  );
}

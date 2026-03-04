"use client";

import { Suspense } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { OrdersKanbanBoard } from "@/features/orders/components";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchIcon } from "lucide-react";

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
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-75 shrink-0">
              {/* Column header skeleton */}
              <Skeleton className="h-12 w-full rounded-card mb-3" />
              {/* Cards skeleton */}
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

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 flex-1 min-h-0">
        {/* Header con título y buscador */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Gestión de Órdenes
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Administra y supervisa todas las órdenes de tu negocio
            </p>
          </div>

          {/* Buscador */}
          <div className="flex items-center bg-white rounded-card px-4 py-2.5 w-full sm:w-auto sm:min-w-75">
            <SearchIcon className="w-4 h-4 text-slate-400 mr-3" />
            <input
              type="text"
              placeholder="Buscar órdenes..."
              className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full"
            />
          </div>
        </div>

        {/* Orders Board - ocupa el resto del espacio */}
        <div className="flex-1 min-h-0 flex flex-col">
          <Suspense fallback={<OrdersLoading />}>
            <OrdersKanbanBoard />
          </Suspense>
        </div>
      </div>
    </DashboardLayout>
  );
}

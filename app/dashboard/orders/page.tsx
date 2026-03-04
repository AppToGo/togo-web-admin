"use client";

import { Suspense } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { OrdersKanbanBoard } from "@/features/orders/components";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { Skeleton } from "@/components/ui/skeleton";

// Gradientes para avatares
const AVATAR_GRADIENTS = [
  "bg-gradient-pink-purple",
  "bg-gradient-purple-indigo",
  "bg-gradient-blue-cyan",
];

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Homepage Design
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Gestiona los pedidos de tu negocio
            </p>
          </div>

          {/* Avatares del equipo */}
          <div className="flex -space-x-2">
            {AVATAR_GRADIENTS.map((gradient, i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded-full ${gradient} ring-2 ring-white flex items-center justify-center text-white text-xs font-medium`}
              >
                {["JD", "MK", "SL"][i]}
              </div>
            ))}
            <div className="w-10 h-10 rounded-full bg-slate-100 ring-2 ring-white flex items-center justify-center text-slate-500 text-xs font-medium">
              +
            </div>
          </div>
        </div>

        {/* Orders Board */}
        <Suspense fallback={<OrdersLoading />}>
          <OrdersKanbanBoard />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}

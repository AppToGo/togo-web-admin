"use client";

import { Suspense } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { CustomerDetail } from "@/features/customers";
import { Skeleton } from "@/components/ui/skeleton";

interface CustomerDetailPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

function CustomerDetailLoading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-28 rounded-card-xl bg-white/60" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-card-xl bg-white/60" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Skeleton className="h-96 rounded-card-xl bg-white/60 xl:col-span-2" />
        <Skeleton className="h-96 rounded-card-xl bg-white/60" />
      </div>
    </div>
  );
}

export default function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  useAuthGuard();

  // El socket de `/conversations` (pestaña "Conversación" del pedido y
  // sección de conversaciones del cliente) lo abre DashboardRealtime en el
  // layout del dashboard.

  // Usar React.use() para unwrap el Promise de params (Next.js 15)
  const { id } = React.use(params);

  return (
    <DashboardLayout>
      <Suspense fallback={<CustomerDetailLoading />}>
        <CustomerDetail customerId={id} />
      </Suspense>
    </DashboardLayout>
  );
}

// Importar React para usar React.use()
import * as React from "react";

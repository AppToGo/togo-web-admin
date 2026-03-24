"use client";

import { Suspense } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { CustomerDetail } from "@/features/customers";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";

interface CustomerDetailPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

function CustomerDetailLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Header skeleton */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar skeleton */}
        <div className="hidden lg:block w-80 border-r border-slate-200 bg-white p-6">
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2 mt-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </div>

        {/* Main skeleton */}
        <div className="flex-1 p-4 sm:p-6 space-y-6 bg-slate-50/50">
          {/* Metrics grid skeleton */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          {/* Split layout skeleton */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Skeleton className="xl:col-span-2 h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const t = useTranslations("customers");
  useAuthGuard();

  // Usar React.use() para unwrap el Promise de params (Next.js 15)
  const { id } = React.use(params);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <Suspense fallback={<CustomerDetailLoading />}>
          <CustomerDetail customerId={id} />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}

// Importar React para usar React.use()
import * as React from "react";

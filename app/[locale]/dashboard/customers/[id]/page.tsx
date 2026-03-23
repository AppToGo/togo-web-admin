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
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-24" />
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Content skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
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

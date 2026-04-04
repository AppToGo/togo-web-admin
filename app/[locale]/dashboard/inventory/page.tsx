"use client";

/**
 * Inventory Page (Read-Only View)
 *
 * Página de vista de solo lectura del inventario por sede.
 * La gestión completa de productos se realiza desde la página de Productos.
 * URL: /dashboard/inventory
 */

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { useBranches } from "@/features/branches/hooks/useBranches";
import { BranchInventoryManager } from "@/features/branch-inventory/components/BranchInventoryManager";
import { Store, Package, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslations } from "next-intl";

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-10 w-80" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function NoBusinessState() {
  const t = useTranslations("inventory");

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
      <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
        <Store className="w-8 h-8 text-amber-500" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">
        {t("noBusiness.title")}
      </h2>
      <p className="text-slate-500 text-center max-w-md">
        {t("noBusiness.description")}
      </p>
    </div>
  );
}

function NoBranchesState() {
  const t = useTranslations("inventory");

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Package className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        {t("noBranches.title")}
      </h3>
      <p className="text-slate-500 text-center max-w-md">
        {t("noBranches.description")}
      </p>
    </div>
  );
}

export default function InventoryPage() {
  const t = useTranslations("inventory");

  useAuthGuard();

  const businessId = useEffectiveBusinessId();
  const { data: branches, isLoading: isLoadingBranches } = useBranches();

  if (!businessId) {
    return (
      <DashboardLayout>
        <NoBusinessState />
      </DashboardLayout>
    );
  }

  if (isLoadingBranches) {
    return (
      <DashboardLayout>
        <LoadingState />
      </DashboardLayout>
    );
  }

  if (!branches || branches.length === 0) {
    return (
      <DashboardLayout>
        <NoBranchesState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header con título y descripción */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-slate-500">
            {t("readOnlySubtitle")}{" "}
            <a
              href="/dashboard/products"
              className="text-primary hover:underline font-medium"
            >
              {t("productsLink")}
            </a>{" "}
            {t("manageAvailability")}
          </p>
        </div>

        {/* Alerta informativa */}
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">
            {t("readOnlyTitle")}
          </AlertTitle>
          <AlertDescription className="text-blue-700">
            {t("readOnlyDescription")}{" "}
            <a
              href="/dashboard/products"
              className="font-semibold underline hover:no-underline"
            >
              {t("productsLink")}
            </a>
            . {t("operatorsNote")}
          </AlertDescription>
        </Alert>

        {/* Inventory management component */}
        <BranchInventoryManager readOnly={true}
          businessId={businessId}
          branches={branches.map((b) => ({
            id: b.id,
            name: b.name,
            code: b.code,
            isMainBranch: b.isMainBranch,
          }))}
        />
      </div>
    </DashboardLayout>
  );
}

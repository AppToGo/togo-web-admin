"use client";
/**
 * Ruta de Caja (docs/caja-pedidos.md).
 *
 * Gateo por pestaña: sin `cash.view` no se renderiza nada operativo.
 * La caja opera por sede: con una sola sede efectiva (o una filtrada en
 * el tablero) se muestra `CashPage`; con varias, selector + vista dueño.
 * Lo que se elige en el selector de esta página manda sobre el filtro del
 * tablero y la sede por defecto, incluido "Todas las sedes".
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Store } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import {
  useHasBusiness,
  useIsSuperAdmin,
} from "@/features/auth/stores/auth.store";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { useEffectiveBranches } from "@/features/branches/hooks";
import { useBranchStore } from "@/stores/branch.store";
import { BranchSingleSelector } from "@/features/branches/components/BranchSingleSelector";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import { CashPage, OwnerOverview } from "@/features/cash/components";

export default function CashRoutePage() {
  const t = useTranslations("cash");
  const tOrders = useTranslations("orders");

  useAuthGuard();
  const hasBusiness = useHasBusiness();
  const isSuperAdmin = useIsSuperAdmin();
  const businessId = useEffectiveBusinessId();
  const { hasPermission, isLoading: isLoadingPermissions } = useMyPermissions();

  const {
    branches: effectiveBranches,
    isLoading: isLoadingBranches,
    defaultBranchId,
  } = useEffectiveBranches();
  const selectedBranchIds = useBranchStore((state) => state.selectedBranchIds);
  // `undefined` = todavía no eligió acá; `null` = eligió "Todas las sedes".
  const [pickedBranchId, setPickedBranchId] = useState<string | null | undefined>(
    undefined
  );

  // Sin elección propia: la única filtrada en el tablero, la default o la
  // única efectiva — misma heurística que `NewOrderDrawer`.
  const fallbackBranchId =
    (selectedBranchIds?.length === 1 ? selectedBranchIds[0] : null) ??
    defaultBranchId ??
    (effectiveBranches.length === 1 ? effectiveBranches[0].id : null);
  const singleBranchId =
    pickedBranchId !== undefined ? pickedBranchId : fallbackBranchId;

  const gate = (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
          <Store className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          {t("title")}
        </h2>
        <p className="text-slate-500 text-center max-w-md mb-6">
          {tOrders("noBusiness.description")}
        </p>
      </div>
    </DashboardLayout>
  );

  if (!hasBusiness && !isSuperAdmin) return gate;

  if (!isLoadingBranches && effectiveBranches.length === 0 && !isSuperAdmin) {
    return gate;
  }

  // Mientras cargan los permisos no se sabe si puede ver la caja: no mostrar
  // "sin permiso" a quien sí lo tiene.
  if (isLoadingPermissions) {
    return (
      <DashboardLayout>
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      </DashboardLayout>
    );
  }

  if (!hasPermission("cash.view")) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <p className="text-slate-500 text-center max-w-md">{t("noPermission")}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!businessId) return gate;

  return (
    <DashboardLayout>
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t("title")}</h1>
            <p className="text-sm text-slate-500">{t("description")}</p>
          </div>
          <span className="flex-1" />
          {effectiveBranches.length > 1 && (
            <BranchSingleSelector
              value={singleBranchId}
              onChange={setPickedBranchId}
              className="w-56"
            />
          )}
        </div>

        {singleBranchId ? (
          <CashPage
            key={singleBranchId}
            businessId={businessId}
            branchId={singleBranchId}
          />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">{t("selectBranchDescription")}</p>
            <OwnerOverview businessId={businessId} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

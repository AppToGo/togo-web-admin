"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MobileFab } from "@/components/ui/mobile-fab";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import {
  useHasBusiness,
  useIsSuperAdmin,
} from "@/features/auth/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, Plus } from "lucide-react";
import { PillGroup } from "@/components/ui/pill-group";
import { useTranslations } from "next-intl";
import {
  useBranches,
  useCanCreateBranch,
  useDeleteBranch,
  useSetMainBranch,
  BranchCard,
  BranchLimitIndicator,
} from "@/features/branches";
import {
  useWhatsAppAccounts,
  useWhatsAppRoutings,
  WhatsAppConnectDialog,
} from "@/features/whatsapp";
import type { Branch } from "@/features/branches";
import {
  getBranchStatus,
  matchesBranchFilter,
} from "@/features/branches/utils/branch-status";
import type { BranchFilter } from "@/features/branches/utils/branch-status";

const FILTERS: BranchFilter[] = ["all", "open", "closed", "off"];
const FILTER_DOT: Record<BranchFilter, string | undefined> = {
  all: undefined,
  open: "bg-emerald-500",
  closed: "bg-red-500",
  off: "bg-slate-400",
};

function BranchesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}

function EmptyBranchesState({ onCreate }: { onCreate: () => void }) {
  const t = useTranslations("branches");

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
        <Store className="w-10 h-10 text-slate-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">
        {t("empty.title")}
      </h3>
      <p className="text-slate-500 text-center max-w-md mb-6">
        {t("empty.description")}
      </p>
      <Button onClick={onCreate}>
        <Plus className="w-4 h-4 mr-2" />
        {t("createBranch")}
      </Button>
    </div>
  );
}

export default function BranchesPage() {
  const t = useTranslations("branches");
  const router = useRouter();

  useAuthGuard();
  const hasBusiness = useHasBusiness();
  const isSuperAdmin = useIsSuperAdmin();

  const { data: branches, isLoading } = useBranches();
  const { data: limitData, isLoading: isLoadingLimit } = useCanCreateBranch();
  const deleteBranch = useDeleteBranch();
  const setMainBranch = useSetMainBranch();

  // WhatsApp data
  const { data: whatsappAccounts } = useWhatsAppAccounts();
  const { data: whatsappRoutings } = useWhatsAppRoutings();

  // WhatsApp dialog state
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [whatsappDialogBranch, setWhatsappDialogBranch] =
    useState<Branch | null>(null);
  const [filter, setFilter] = useState<BranchFilter>("all");

  const withStatus = useMemo(
    () => (branches ?? []).map((branch) => ({ branch, status: getBranchStatus(branch) })),
    [branches]
  );
  const counts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((f) => [f, withStatus.filter((b) => matchesBranchFilter(b.status, f)).length])
      ) as Record<BranchFilter, number>,
    [withStatus]
  );
  // Con una sola sede no hay pastillas: un filtro que quedó elegido no aplica.
  const activeFilter: BranchFilter = withStatus.length > 1 ? filter : "all";
  const visibleBranches = withStatus
    .filter((b) => matchesBranchFilter(b.status, activeFilter))
    .map((b) => b.branch);

  const handleCreateBranch = () => {
    router.push("/dashboard/branches/new");
  };

  const handleEditBranch = (branchId: string) => {
    router.push(`/dashboard/branches/${branchId}`);
  };

  const handleDeleteBranch = (branchId: string) => {
    deleteBranch.mutate(branchId);
  };

  const handleSetMainBranch = (branchId: string) => {
    setMainBranch.mutate(branchId);
  };

  const handleUpgrade = () => {
    router.push("/dashboard/settings");
  };

  const handleConnectWhatsApp = (branch: Branch) => {
    setWhatsappDialogBranch(branch);
    setWhatsappDialogOpen(true);
  };

  // Helpers to find the active routing and account for a given branch
  const getRoutingForBranch = (branchId: string) =>
    whatsappRoutings?.find(
      (r) => r.branchId === branchId && r.isActive
    ) ?? null;

  const getAccountForRouting = (whatsappAccountId: string | undefined) => {
    if (!whatsappAccountId) return null;
    return whatsappAccounts?.find((a) => a.id === whatsappAccountId) ?? null;
  };

  if (!hasBusiness && !isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {t("noBusiness.title")}
          </h2>
          <p className="text-slate-500 text-center max-w-md mb-6">
            {t("noBusiness.description")}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Derived data for the dialog
  const dialogRouting = whatsappDialogBranch
    ? getRoutingForBranch(whatsappDialogBranch.id)
    : null;
  const dialogAccount = dialogRouting
    ? getAccountForRouting(dialogRouting.whatsappAccountId)
    : null;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5 flex-1 min-h-0">
        {/* Header (< md: título en la barra superior y crear en el botón flotante) */}
        <div className="hidden md:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Store className="h-6 w-6 text-indigo-600" />
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {limitData && limitData.max > 1 && (
              <div className="flex min-w-44 flex-col gap-1.5">
                <span className="text-[13px] text-slate-600">
                  {t.rich("limits.usageRich", {
                    current: limitData.current,
                    max: limitData.max,
                    b: (chunks) => <b className="text-slate-900">{chunks}</b>,
                  })}
                </span>
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-slate-200/90"
                  role="progressbar"
                  aria-label={t("limits.title")}
                  aria-valuenow={limitData.current}
                  aria-valuemin={0}
                  aria-valuemax={limitData.max}
                >
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${Math.min(100, (limitData.current / limitData.max) * 100)}%` }}
                  />
                </div>
              </div>
            )}
            <Button
              onClick={handleCreateBranch}
              className="h-11 rounded-card px-5"
              disabled={limitData ? !limitData.allowed : false}
            >
              <Plus className="h-4 w-4" />
              {t("createBranch")}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <BranchesLoading />
        ) : (
          <>
            {/* Al tope del plan: el aviso con la opción de mejorar */}
            {limitData && !limitData.allowed && (
              <BranchLimitIndicator
                limitData={limitData}
                isLoading={isLoadingLimit}
                onUpgrade={handleUpgrade}
              />
            )}

            {!branches || branches.length === 0 ? (
              <EmptyBranchesState onCreate={handleCreateBranch} />
            ) : (
              <>
                {branches.length > 1 && (
                  <PillGroup
                    label={t("filters.label")}
                    value={activeFilter}
                    onChange={setFilter}
                    appearance="glass"
                    options={FILTERS.map((f) => ({
                      id: f,
                      label: t(`filters.${f}`),
                      count: counts[f],
                      dotClassName: FILTER_DOT[f],
                    }))}
                  />
                )}
                {visibleBranches.length === 0 ? (
                  <p className="rounded-card-xl border border-white/80 bg-white/45 px-4 py-12 text-center text-sm text-slate-500">
                    {t("filters.empty")}
                  </p>
                ) : (
                  <ul
                    className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-4"
                    data-testid="branches-grid"
                  >
                    {visibleBranches.map((branch) => {
                      const routing = getRoutingForBranch(branch.id);
                      const account = getAccountForRouting(routing?.whatsappAccountId);
                      return (
                        <BranchCard
                          key={branch.id}
                          branch={branch}
                          onEdit={(b) => handleEditBranch(b.id)}
                          onDelete={(b) => handleDeleteBranch(b.id)}
                          onMakeMain={(b) => handleSetMainBranch(b.id)}
                          onConnectWhatsApp={handleConnectWhatsApp}
                          whatsappRouting={routing}
                          whatsappAccount={account}
                          isLoading={deleteBranch.isPending || setMainBranch.isPending}
                        />
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* WhatsApp Connect/Edit Dialog */}
      {whatsappDialogBranch && (
        <WhatsAppConnectDialog
          open={whatsappDialogOpen}
          onOpenChange={(open) => {
            setWhatsappDialogOpen(open);
            if (!open) setWhatsappDialogBranch(null);
          }}
          branchId={whatsappDialogBranch.id}
          branchName={whatsappDialogBranch.name}
          account={dialogAccount}
          existingRouting={dialogRouting}
        />
      )}
      {(!limitData || limitData.allowed) && (
        <MobileFab label={t("createBranch")} onClick={handleCreateBranch} />
      )}
    </DashboardLayout>
  );
}

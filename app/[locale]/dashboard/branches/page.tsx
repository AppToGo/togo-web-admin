"use client";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import {
  useHasBusiness,
  useIsSuperAdmin,
} from "@/features/auth/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useBranches,
  useCanCreateBranch,
  useDeleteBranch,
  useSetMainBranch,
  BranchCard,
  BranchLimitIndicator,
} from "@/features/branches";

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

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 flex-1 min-h-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Store className="h-6 w-6 text-indigo-600" />
              {t("title")}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">{t("subtitle")}</p>
          </div>
          <Button
            onClick={handleCreateBranch}
            className="self-start"
            disabled={limitData ? !limitData.allowed : false}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("createBranch")}
          </Button>
        </div>

        {isLoading ? (
          <BranchesLoading />
        ) : (
          <>
            {/* Branch Limit Indicator */}
            {limitData && (
              <BranchLimitIndicator
                limitData={limitData}
                isLoading={isLoadingLimit}
                onUpgrade={handleUpgrade}
              />
            )}

            {/* Branches Grid */}
            {!branches || branches.length === 0 ? (
              <EmptyBranchesState onCreate={handleCreateBranch} />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {branches.map((branch) => (
                  <BranchCard
                    key={branch.id}
                    branch={branch}
                    onEdit={(b) => handleEditBranch(b.id)}
                    onDelete={(b) => handleDeleteBranch(b.id)}
                    onMakeMain={(b) => handleSetMainBranch(b.id)}
                    isLoading={deleteBranch.isPending || setMainBranch.isPending}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

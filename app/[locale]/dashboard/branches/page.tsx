"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import {
  useHasBusiness,
  useIsSuperAdmin,
} from "@/features/auth/stores/auth.store";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, Plus, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

// Placeholder components - these should be created in features/branches/components
// and imported from there when available
function BranchLimitIndicator({ businessId }: { businessId?: string }) {
  // Placeholder implementation
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-blue-900">Límite de Sedes</p>
          <p className="text-sm text-blue-600">1 de 3 sedes utilizadas</p>
        </div>
      </div>
      <div className="w-32 h-2 bg-blue-200 rounded-full overflow-hidden">
        <div className="w-1/3 h-full bg-blue-500 rounded-full" />
      </div>
    </div>
  );
}

interface Branch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  isMainBranch: boolean;
  isActive: boolean;
  whatsappPhoneNumber: string | null;
}

function BranchCard({
  branch,
  onClick,
}: {
  branch: Branch;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
          <Store className="w-6 h-6 text-indigo-600" />
        </div>
        {branch.isMainBranch && (
          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
            Principal
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-slate-900 mb-1">{branch.name}</h3>
      <p className="text-sm text-slate-500 mb-3">{branch.code}</p>

      {branch.address && (
        <p className="text-sm text-slate-600 mb-3 flex items-center gap-1">
          <MapPin className="w-4 h-4 text-slate-400" />
          {branch.address}
        </p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span
          className={`text-sm font-medium ${
            branch.isActive ? "text-green-600" : "text-slate-400"
          }`}
        >
          {branch.isActive ? "Activa" : "Inactiva"}
        </span>
        {branch.whatsappPhoneNumber && (
          <span className="text-sm text-slate-500">{branch.whatsappPhoneNumber}</span>
        )}
      </div>
    </div>
  );
}

function BranchesLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-start">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Limit indicator skeleton */}
      <Skeleton className="h-20 w-full" />

      {/* Grid skeleton */}
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
  const tc = useTranslations("common");

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

// Mock data for demonstration - replace with actual hook when available
function useBranches({ businessId }: { businessId?: string }) {
  // This is a placeholder - should be replaced with actual API call
  const [branches] = useState<Branch[]>([
    {
      id: "1",
      name: "Sede Principal",
      code: "MAIN001",
      address: "Av. Principal 123",
      isMainBranch: true,
      isActive: true,
      whatsappPhoneNumber: "+1234567890",
    },
  ]);
  const [isLoading] = useState(false);

  return {
    data: branches,
    isLoading,
  };
}

export default function BranchesPage() {
  const t = useTranslations("branches");
  const tc = useTranslations("common");
  const router = useRouter();

  useAuthGuard();
  const hasBusiness = useHasBusiness();
  const isSuperAdmin = useIsSuperAdmin();
  const selectedBusinessId = useEffectiveBusinessId();

  const { data: branches, isLoading } = useBranches({
    businessId: selectedBusinessId || undefined,
  });

  const handleCreateBranch = () => {
    router.push("/dashboard/branches/new");
  };

  const handleEditBranch = (branchId: string) => {
    router.push(`/dashboard/branches/${branchId}`);
  };

  // Para usuarios normales sin negocio, mostrar error
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
          <Button onClick={handleCreateBranch} className="self-start">
            <Plus className="w-4 h-4 mr-2" />
            {t("createBranch")}
          </Button>
        </div>

        <Suspense fallback={<BranchesLoading />}>
          {isLoading ? (
            <BranchesLoading />
          ) : (
            <>
              {/* Branch Limit Indicator */}
              <BranchLimitIndicator businessId={selectedBusinessId || undefined} />

              {/* Branches Grid */}
              {branches.length === 0 ? (
                <EmptyBranchesState onCreate={handleCreateBranch} />
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {branches.map((branch) => (
                    <BranchCard
                      key={branch.id}
                      branch={branch}
                      onClick={() => handleEditBranch(branch.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </Suspense>
      </div>
    </DashboardLayout>
  );
}

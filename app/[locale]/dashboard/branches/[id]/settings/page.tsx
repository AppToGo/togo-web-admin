"use client";

import { useParams, useRouter } from "next/navigation";
import { useBranch, useUpdateBranch, BranchSettingsForm } from "@/features/branches";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";

export default function BranchSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const branchId = params.id as string;

  useAuthGuard();

  const { data: branch, isLoading } = useBranch(branchId);
  const updateBranch = useUpdateBranch();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Sede no encontrada</h1>
          <p className="text-slate-500 mt-2">
            La sede que buscas no existe o no tienes acceso a ella.
          </p>
        </div>
      </div>
    );
  }

  return (
    <BranchSettingsForm
      branch={branch}
      onSave={async (data) => {
        await updateBranch.mutateAsync({
          branchId: branchId,
          data: {
            name: data.name,
            contactPhone: data.contactPhone,
            address: data.address,
            deliveryConfig: data.deliveryConfig,
            businessHours: data.businessHours,
          },
        });
        router.push("/dashboard/branches");
      }}
      isSaving={updateBranch.isPending}
      mode="PAGE"
      backUrl="/dashboard/branches"
    />
  );
}

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
import { Shield, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useOperatorProfiles,
  useDeleteProfile,
  OperatorProfileCard,
} from "@/features/operator-profiles";

function OperatorProfilesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}

function EmptyProfilesState({ onCreate }: { onCreate: () => void }) {
  const t = useTranslations("operatorProfiles");

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
        <Shield className="w-10 h-10 text-slate-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">
        {t("empty.title")}
      </h3>
      <p className="text-slate-500 text-center max-w-md mb-6">
        {t("empty.description")}
      </p>
      <Button onClick={onCreate}>
        <Plus className="w-4 h-4 mr-2" />
        {t("createProfile")}
      </Button>
    </div>
  );
}

export default function OperatorProfilesPage() {
  const t = useTranslations("operatorProfiles");
  const router = useRouter();

  useAuthGuard();
  const hasBusiness = useHasBusiness();
  const isSuperAdmin = useIsSuperAdmin();

  const { data: profiles, isLoading } = useOperatorProfiles();
  const deleteProfile = useDeleteProfile();

  const handleCreateProfile = () => {
    router.push("/dashboard/settings/operator-profiles/new");
  };

  const handleEditProfile = (profileId: string) => {
    router.push(`/dashboard/settings/operator-profiles/${profileId}`);
  };

  const handleDeleteProfile = (profileId: string) => {
    deleteProfile.mutate(profileId);
  };

  if (!hasBusiness && !isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-amber-500" />
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
              <Shield className="h-6 w-6 text-indigo-600" />
              {t("title")}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">{t("subtitle")}</p>
          </div>
          <Button
            onClick={handleCreateProfile}
            className="self-start"
            disabled={deleteProfile.isPending}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("createProfile")}
          </Button>
        </div>

        {isLoading ? (
          <OperatorProfilesLoading />
        ) : (
          <>
            {/* Profiles Grid */}
            {!profiles || profiles.length === 0 ? (
              <EmptyProfilesState onCreate={handleCreateProfile} />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {profiles.map((profile) => (
                  <OperatorProfileCard
                    key={profile.id}
                    profile={profile}
                    onEdit={(p) => handleEditProfile(p.id)}
                    onDelete={(p) => handleDeleteProfile(p.id)}
                    isLoading={deleteProfile.isPending}
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

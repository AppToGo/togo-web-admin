"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Store, MapPin } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import {
  useHasBusiness,
  useIsSuperAdmin,
} from "@/features/auth/stores/auth.store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { UpdateBranchRequest } from "@/features/branches/types";
import { BranchForm, useBranch, useUpdateBranch } from "@/features/branches";
import { getPrimaryWhatsApp } from "@/features/branches/utils/branch-helpers";

export default function EditBranchPage() {
  const t = useTranslations("branches");
  const tc = useTranslations("common");
  const router = useRouter();

  useAuthGuard();
  const hasBusiness = useHasBusiness();
  const isSuperAdmin = useIsSuperAdmin();

  const params = useParams();
  const id = params.id as string;
  const locale = params.locale as string;

  const { data: branch, isLoading: isLoadingBranch } = useBranch(id);
  const updateBranch = useUpdateBranch();

  const handleSubmit = (data: UpdateBranchRequest) => {
    updateBranch.mutate(
      { branchId: id, data },
      {
        onSuccess: () => {
          router.push("/dashboard/branches");
        },
      }
    );
  };

  const handleCancel = () => {
    router.push("/dashboard/branches");
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

  if (isLoadingBranch) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-2xl">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10" />
            <div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48 mt-2" />
            </div>
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!branch) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {t("notFound.title")}
          </h2>
          <p className="text-slate-500 text-center max-w-md mb-6">
            {t("notFound.description")}
          </p>
          <Button onClick={() => router.push("/dashboard/branches")}>
            {tc("buttons.back")}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/branches")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {t("edit.title")}
              </h1>
              <Badge
                variant={branch.isActive ? "default" : "secondary"}
                className={cn(
                  branch.isActive
                    ? "bg-green-100 text-green-700 hover:bg-green-100"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                )}
              >
                {branch.isActive ? tc("status.active") : tc("status.inactive")}
              </Badge>
              {branch.isMainBranch && (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-200"
                >
                  {t("mainBranch")}
                </Badge>
              )}
            </div>
            <p className="text-slate-500 font-mono text-sm">{branch.code}</p>
          </div>
        </div>

        {/* Form Card */}
        <BranchForm
          branch={branch}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={updateBranch.isPending}
        />

        {/* Branch Info Card */}
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {t("info.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">{tc("fields.created")}:</span>
              <span className="text-slate-700">
                {new Date(branch.createdAt).toLocaleDateString(locale, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">
                {tc("fields.lastUpdated")}:
              </span>
              <span className="text-slate-700">
                {new Date(branch.updatedAt).toLocaleDateString(locale, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            {(() => {
              const phone = getPrimaryWhatsApp(branch);
              return phone ? (
                <div className="flex justify-between">
                  <span className="text-slate-500">WhatsApp:</span>
                  <span className="text-slate-700">{phone}</span>
                </div>
              ) : null;
            })()}
            <div className="flex justify-between">
              <span className="text-slate-500">{t("timezone")}:</span>
              <span className="text-slate-700">{branch.timezone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t("currency")}:</span>
              <span className="text-slate-700">{branch.currency}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Store } from "lucide-react";
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
import { useTranslations } from "next-intl";
import type { CreateBranchRequest, UpdateBranchRequest } from "@/features/branches/types";
import {
  BranchForm,
  useCreateBranch,
  useCanCreateBranch,
} from "@/features/branches";

export default function CreateBranchPage() {
  const t = useTranslations("branches");
  const tc = useTranslations("common");
  const router = useRouter();

  useAuthGuard();
  const hasBusiness = useHasBusiness();
  const isSuperAdmin = useIsSuperAdmin();

  const createBranch = useCreateBranch();
  const { data: canCreate, isLoading: isLoadingCanCreate } = useCanCreateBranch();

  const handleSubmit = (data: CreateBranchRequest | UpdateBranchRequest) => {
    createBranch.mutate(data as CreateBranchRequest, {
      onSuccess: () => {
        router.push("/dashboard/branches");
      },
    });
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

  if (!isLoadingCanCreate && canCreate && !canCreate.allowed) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/branches")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {t("create.title")}
              </h1>
              <p className="text-slate-500">{t("create.subtitle")}</p>
            </div>
          </div>

          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center py-8">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                  <Store className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-amber-900 mb-2">
                  {t("limitReached.title")}
                </h3>
                <p className="text-amber-700 max-w-md mb-4">
                  {t("limitReached.description", {
                    current: canCreate.current,
                    max: canCreate.max,
                  })}
                </p>
                <Button variant="outline" onClick={handleCancel}>
                  {tc("buttons.back")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/branches")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t("create.title")}
            </h1>
            <p className="text-slate-500">{t("create.subtitle")}</p>
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("form.title")}</CardTitle>
            <CardDescription>{t("form.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCanCreate ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-32" />
              </div>
            ) : (
              <BranchForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={createBranch.isPending}
              />
            )}
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">{t("tips.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>
              <strong>{t("tips.code")}:</strong> {t("tips.codeDescription")}
            </p>
            <p>
              <strong>{t("tips.mainBranch")}:</strong>{" "}
              {t("tips.mainBranchDescription")}
            </p>
            <p>
              <strong>{t("tips.whatsapp")}:</strong>{" "}
              {t("tips.whatsappDescription")}
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

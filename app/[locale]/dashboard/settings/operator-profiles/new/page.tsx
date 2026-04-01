"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, Save } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import {
  useCreateProfile,
  PermissionSelector,
  usePermissionCatalog,
} from "@/features/operator-profiles";
import type { CreateProfileRequest } from "@/features/operator-profiles/types";
import type { ProfilePermission } from "@/features/operator-profiles/types";

export default function CreateProfilePage() {
  const t = useTranslations("operatorProfiles");
  const tc = useTranslations("common");
  const router = useRouter();

  useAuthGuard();
  const hasBusiness = useHasBusiness();
  const isSuperAdmin = useIsSuperAdmin();

  const createProfile = useCreateProfile();
  const { data: permissionsCatalog, isLoading: isLoadingPermissions } =
    usePermissionCatalog();

  const [name, setName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<
    ProfilePermission[]
  >([]);
  const [nameError, setNameError] = useState<string | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);

    if (!value.trim()) {
      setNameError(t("form.errors.nameRequired"));
    } else if (value.length > 100) {
      setNameError(t("form.errors.nameTooLong"));
    } else {
      setNameError(null);
    }
  };

  const handleSubmit = () => {
    // Validate name
    if (!name.trim()) {
      setNameError(t("form.errors.nameRequired"));
      return;
    }

    if (name.length > 100) {
      setNameError(t("form.errors.nameTooLong"));
      return;
    }

    const data: CreateProfileRequest = {
      name: name.trim(),
      permissions: selectedPermissions.map((p) => ({
        permissionCode: p.permissionCode,
        params: p.params,
      })),
    };

    createProfile.mutate(data, {
      onSuccess: () => {
        router.push("/dashboard/settings/operator-profiles");
      },
    });
  };

  const handleCancel = () => {
    router.push("/dashboard/settings/operator-profiles");
  };

  const isValid = name.trim() && name.length <= 100 && !nameError;

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
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/settings/operator-profiles")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t("create.title")}
            </h1>
            <p className="text-slate-500">{t("create.subtitle")}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" />
                {t("form.sections.basic")}
              </CardTitle>
              <CardDescription>{t("form.descriptions.basic")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">
                  {t("form.fields.name")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={handleNameChange}
                  placeholder={t("form.placeholders.name")}
                  disabled={createProfile.isPending}
                  error={nameError || undefined}
                  maxLength={100}
                />
                <p className="text-xs text-slate-500">{t("form.help.name")}</p>
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" />
                {t("permissions.title")}
              </CardTitle>
              <CardDescription>{t("permissions.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPermissions ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : (
                <PermissionSelector
                  permissions={permissionsCatalog || []}
                  selectedPermissions={selectedPermissions}
                  onChange={setSelectedPermissions}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={createProfile.isPending}
          >
            {tc("buttons.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createProfile.isPending || !isValid}
            isLoading={createProfile.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {t("form.createProfile")}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

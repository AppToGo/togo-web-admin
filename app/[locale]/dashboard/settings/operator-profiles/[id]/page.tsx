"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Shield, Save, Copy, Trash2, Users } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslations } from "next-intl";
import {
  useOperatorProfile,
  useUpdateProfile,
  useDeleteProfile,
  useCloneProfile,
  useAssignPermissions,
  PermissionSelector,
  CloneProfileDialog,
  usePermissionCatalog,
} from "@/features/operator-profiles";
import type { UpdateProfileRequest } from "@/features/operator-profiles/types";
import type { ProfilePermission } from "@/features/operator-profiles/types";

export default function EditProfilePage() {
  const t = useTranslations("operatorProfiles");
  const tc = useTranslations("common");
  const router = useRouter();

  useAuthGuard();
  const hasBusiness = useHasBusiness();
  const isSuperAdmin = useIsSuperAdmin();

  const params = useParams();
  const id = params.id as string;
  const locale = params.locale as string;

  const { data: profile, isLoading: isLoadingProfile } = useOperatorProfile(id);
  const { data: permissionsCatalog, isLoading: isLoadingPermissions } =
    usePermissionCatalog();

  const updateProfile = useUpdateProfile();
  const deleteProfile = useDeleteProfile();
  const cloneProfile = useCloneProfile();
  const assignPermissions = useAssignPermissions();

  const [activeTab, setActiveTab] = useState("general");
  const [name, setName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<
    ProfilePermission[]
  >([]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setSelectedPermissions(profile.permissions || []);
    }
  }, [profile]);

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

  const handleSaveGeneral = () => {
    if (!profile) return;

    if (!name.trim()) {
      setNameError(t("form.errors.nameRequired"));
      return;
    }

    if (name.length > 100) {
      setNameError(t("form.errors.nameTooLong"));
      return;
    }

    const data: UpdateProfileRequest = {
      name: name.trim(),
    };

    updateProfile.mutate({ profileId: id, data });
  };

  const handleSavePermissions = () => {
    if (!profile) return;

    assignPermissions.mutate({
      profileId: id,
      data: {
        permissionCodes: selectedPermissions.map((p) => p.permissionCode),
      },
    });
  };

  const handleDelete = () => {
    deleteProfile.mutate(id, {
      onSuccess: () => {
        router.push("/dashboard/settings/operator-profiles");
      },
    });
  };

  const handleClone = (cloneName: string) => {
    cloneProfile.mutate(
      { profileId: id, data: { name: cloneName } },
      {
        onSuccess: () => {
          setShowCloneDialog(false);
        },
      }
    );
  };

  const handleCancel = () => {
    router.push("/dashboard/settings/operator-profiles");
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

  if (isLoadingProfile) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-4xl">
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

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {t("notFound.title")}
          </h2>
          <p className="text-slate-500 text-center max-w-md mb-6">
            {t("notFound.description")}
          </p>
          <Button onClick={() => router.push("/dashboard/settings/operator-profiles")}>
            {tc("buttons.back")}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isNameValid = name.trim() && name.length <= 100 && !nameError;
  const hasUnsavedNameChanges = name !== profile.name;
  const hasUnsavedPermissionChanges =
    JSON.stringify(selectedPermissions.map((p) => p.permissionCode).sort()) !==
    JSON.stringify(
      (profile.permissions || []).map((p) => p.permissionCode).sort()
    );

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
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">
                {t("edit.title")}
              </h1>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                <Users className="w-3 h-3 mr-1" />
                {t("card.users", { count: profile.userCount })}
              </Badge>
            </div>
            <p className="text-slate-500 font-mono text-sm">
              {profile.id.slice(0, 8)} • {t("card.permissions", { count: profile.permissions?.length || 0 })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCloneDialog(true)}
              disabled={cloneProfile.isPending}
            >
              <Copy className="w-4 h-4 mr-2" />
              {t("card.clone")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteProfile.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {tc("buttons.delete")}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="general">{t("tabs.general")}</TabsTrigger>
            <TabsTrigger value="permissions">{t("tabs.permissions")}</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
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
                    value={name || profile.name}
                    onChange={handleNameChange}
                    placeholder={t("form.placeholders.name")}
                    disabled={updateProfile.isPending}
                    error={nameError || undefined}
                    maxLength={100}
                  />
                  <p className="text-xs text-slate-500">{t("form.help.name")}</p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateProfile.isPending}
                  >
                    {tc("buttons.cancel")}
                  </Button>
                  <Button
                    onClick={handleSaveGeneral}
                    disabled={updateProfile.isPending || !isNameValid || !hasUnsavedNameChanges}
                    isLoading={updateProfile.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {tc("buttons.saveChanges")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Profile Info */}
            <Card className="bg-slate-50 border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">{t("info.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">{tc("fields.created")}:</span>
                  <span className="text-slate-700">
                    {new Date(profile.createdAt).toLocaleDateString(locale, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{tc("fields.lastUpdated")}:</span>
                  <span className="text-slate-700">
                    {new Date(profile.updatedAt).toLocaleDateString(locale, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  {t("permissions.title")}
                </CardTitle>
                <CardDescription>{t("permissions.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingPermissions ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-64 w-full" />
                  </div>
                ) : (
                  <PermissionSelector
                    permissions={permissionsCatalog || []}
                    selectedPermissions={
                      selectedPermissions.length > 0
                        ? selectedPermissions
                        : profile.permissions || []
                    }
                    onChange={setSelectedPermissions}
                  />
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedPermissions(profile.permissions || [])}
                    disabled={assignPermissions.isPending}
                  >
                    {tc("buttons.reset")}
                  </Button>
                  <Button
                    onClick={handleSavePermissions}
                    disabled={assignPermissions.isPending || !hasUnsavedPermissionChanges}
                    isLoading={assignPermissions.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {tc("buttons.saveChanges")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("delete.description", { name: profile.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteProfile.isPending}>
                {tc("buttons.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                onClick={handleDelete}
                disabled={deleteProfile.isPending}
              >
                {deleteProfile.isPending
                  ? tc("buttons.deleting")
                  : tc("buttons.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Clone Dialog */}
        <CloneProfileDialog
          profile={profile}
          isOpen={showCloneDialog}
          onOpenChange={setShowCloneDialog}
          onClone={handleClone}
          isLoading={cloneProfile.isPending}
        />
      </div>
    </DashboardLayout>
  );
}

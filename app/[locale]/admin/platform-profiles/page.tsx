"use client";

/**
 * Perfiles de los usuarios internos de ToGo (solo SUPER_ADMIN). Los perfiles
 * por defecto (Comercial, Supervisor) se editan pero no se eliminan.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, ShieldCheck, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useIsRootSuperAdmin } from "@/features/auth/stores/auth.store";
import {
  useDeletePlatformProfile,
  usePlatformPermissionCatalog,
  usePlatformProfiles,
} from "@/features/admin/internal-users/hooks/useInternalUsers";
import { usePlatformPermissionLabels } from "@/features/admin/internal-users/hooks/usePlatformPermissionLabels";
import { PlatformProfileDialog } from "@/features/admin/internal-users/components/PlatformProfileDialog";
import type { PlatformProfile } from "@/features/admin/internal-users/types";

export default function AdminPlatformProfilesPage() {
  const t = useTranslations("admin-internal-users");
  const { isLoading: isAuthLoading } = useAuthGuard();
  const isRoot = useIsRootSuperAdmin();
  const { data: profiles, isLoading } = usePlatformProfiles(isRoot);
  const { data: permissions = [] } = usePlatformPermissionCatalog(isRoot);
  const { labelOf } = usePlatformPermissionLabels();
  const deleteProfile = useDeletePlatformProfile();
  // undefined = cerrado; null = crear
  const [editing, setEditing] = useState<PlatformProfile | null | undefined>(undefined);
  const [toDelete, setToDelete] = useState<PlatformProfile | null>(null);

  if (isAuthLoading) return null;

  if (!isRoot) {
    return (
      <DashboardLayout>
        <p className="text-sm text-slate-500">{t("accessDenied")}</p>
      </DashboardLayout>
    );
  }

  const descriptionOf = (code: string) =>
    labelOf(code, permissions.find((p) => p.code === code)?.description ?? code);

  return (
    <DashboardLayout>
      <div className="space-y-4 lg:space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="hidden items-center gap-2 text-2xl font-bold text-slate-900 lg:flex">
              <ShieldCheck className="h-6 w-6 text-indigo-600" aria-hidden />
              {t("profiles.title")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{t("profiles.subtitle")}</p>
          </div>
          <Button onClick={() => setEditing(null)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("profiles.add")}
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {profiles?.map((profile) => (
              <Card key={profile.id} className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{profile.name}</p>
                      {profile.isSystem && <Badge variant="outline">{t("profiles.system")}</Badge>}
                    </div>
                    {profile.description && (
                      <p className="text-sm text-slate-500">{profile.description}</p>
                    )}
                  </div>
                  <span className="whitespace-nowrap text-xs text-slate-500">
                    {t("profiles.userCount", { count: profile.userCount })}
                  </span>
                </div>
                <ul className="flex-1 space-y-1 text-sm text-slate-700">
                  {profile.permissionCodes.length === 0 ? (
                    <li className="text-slate-400">{t("profiles.noPermissions")}</li>
                  ) : (
                    profile.permissionCodes.map((code) => <li key={code}>· {descriptionOf(code)}</li>)
                  )}
                </ul>
                <div className="flex justify-end gap-2">
                  {!profile.isSystem && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setToDelete(profile)}
                      aria-label={t("actions.delete")}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setEditing(profile)}>
                    {t("actions.edit")}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {editing !== undefined && (
        <PlatformProfileDialog
          key={editing?.id ?? "new"}
          profile={editing}
          permissions={permissions}
          isOpen
          onClose={() => setEditing(undefined)}
        />
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("profiles.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("profiles.deleteDescription", { name: toDelete?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={() => {
                if (toDelete) deleteProfile.mutate(toDelete.id);
                setToDelete(null);
              }}
            >
              {t("actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

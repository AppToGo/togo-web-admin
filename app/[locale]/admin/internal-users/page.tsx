"use client";

/**
 * Usuarios internos de ToGo (solo SUPER_ADMIN): comerciales, supervisores y
 * demás personal sin negocio, con el perfil que define a qué acceden.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, UserCog } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useIsRootSuperAdmin } from "@/features/auth/stores/auth.store";
import { Link } from "@/i18n/routing";
import {
  useInternalUsers,
  usePlatformProfiles,
  useUpdateInternalUser,
} from "@/features/admin/internal-users/hooks/useInternalUsers";
import { InternalUserDialog } from "@/features/admin/internal-users/components/InternalUserDialog";
import type { InternalUser } from "@/features/admin/internal-users/types";

export default function AdminInternalUsersPage() {
  const t = useTranslations("admin-internal-users");
  const { isLoading: isAuthLoading } = useAuthGuard();
  const isRoot = useIsRootSuperAdmin();
  const { data: users, isLoading } = useInternalUsers(isRoot);
  const { data: profiles = [] } = usePlatformProfiles(isRoot);
  const updateUser = useUpdateInternalUser();
  // undefined = cerrado; null = crear
  const [editing, setEditing] = useState<InternalUser | null | undefined>(undefined);

  if (isAuthLoading) return null;

  if (!isRoot) {
    return (
      <DashboardLayout>
        <p className="text-sm text-slate-500">{t("accessDenied")}</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 lg:space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="hidden items-center gap-2 text-2xl font-bold text-slate-900 lg:flex">
              <UserCog className="h-6 w-6 text-indigo-600" aria-hidden />
              {t("users.title")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {t("users.subtitle")}{" "}
              <Link href="/admin/platform-profiles" className="font-medium text-indigo-600 hover:underline">
                {t("users.manageProfiles")}
              </Link>
            </p>
          </div>
          <Button onClick={() => setEditing(null)} disabled={profiles.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            {t("users.add")}
          </Button>
        </div>

        <Card>
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !users?.length ? (
            <p className="p-8 text-center text-sm text-slate-500">{t("users.empty")}</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {users.map((user) => (
                <div key={user.id} className="flex flex-wrap items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{user.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {user.email} · {user.phoneNumber}
                    </p>
                  </div>
                  <Badge variant="outline">{user.platformProfile?.name ?? t("users.noProfile")}</Badge>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={user.active}
                      disabled={updateUser.isPending}
                      onCheckedChange={(active) => updateUser.mutate({ id: user.id, data: { active } })}
                      aria-label={t("users.active")}
                    />
                    <span className="w-14 text-xs text-slate-500">
                      {user.active ? t("users.active") : t("users.inactive")}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setEditing(user)}>
                    {t("actions.edit")}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {editing !== undefined && (
        <InternalUserDialog
          key={editing?.id ?? "new"}
          user={editing}
          profiles={profiles}
          isOpen
          onClose={() => setEditing(undefined)}
        />
      )}
    </DashboardLayout>
  );
}

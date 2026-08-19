"use client";

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useTranslations } from "next-intl";
import { Users, Plus, User, Crown, Pencil, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Link } from "@/i18n/routing";
import { useUsers, useDeleteUser } from "@/features/users/hooks/useUsers";
import { CreateUserDialog } from "@/features/users/components/CreateUserDialog";
import { usePlanCatalog } from "@/features/subscription/hooks/usePlanCatalog";
import { UNLIMITED_PLAN_LIMIT } from "@/features/subscription/services/subscription.service";
import { UpgradePlanModal } from "@/features/subscription/components/UpgradePlanModal";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getHumanizedErrorMessage } from "@/lib/error.utils";
import type { User as UserType } from "@/features/users/types";

export default function UsersPage() {
  const t = useTranslations("users");
  const tc = useTranslations("common");
  const ts = useTranslations("subscription.upgradePlanModal.features");

  useAuthGuard();

  const { data: users, isLoading } = useUsers();
  const { data: catalog } = usePlanCatalog(true);
  const { user } = useAuthStore();
  const subscriptionPlan = user?.subscriptionPlan ?? 1;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserType | null>(null);
  const deleteUser = useDeleteUser();

  const planEntry = useMemo(() => {
    if (!catalog?.plans) return null;
    return catalog.plans.find((p) => p.plan === subscriptionPlan) ?? null;
  }, [catalog, subscriptionPlan]);

  const maxUsers = planEntry?.maxUsers ?? UNLIMITED_PLAN_LIMIT;
  const activeCount = useMemo(() => users?.filter((u) => u.active).length ?? 0, [users]);
  const isUnlimited = maxUsers >= UNLIMITED_PLAN_LIMIT;
  const isLimitReached = !isUnlimited && activeCount >= maxUsers;

  const limitLabel = isUnlimited
    ? ts("usersUnlimited")
    : maxUsers === 1
      ? ts("usersSingle")
      : ts("usersMultiple", { max: maxUsers });

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(t("deleteDialog.success"));
        setDeleteTarget(null);
      },
      onError: (err) => {
        const message = getHumanizedErrorMessage(err) || t("errors.deleteFailed");
        toast.error(message);
        setDeleteTarget(null);
      },
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "BUSINESS_OWNER":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "OPERATOR":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-indigo-600" />
              {t("title")}
            </h1>
            <p className="text-slate-500 mt-1">{t("subtitle")}</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span className={cn("font-medium", isLimitReached ? "text-amber-600" : "text-slate-700")}>
                {isUnlimited ? `${activeCount} ${t("limits.activeUsers")}` : `${activeCount} / ${maxUsers} ${t("limits.activeUsers")}`}
                {" · "}
                {limitLabel}
                {planEntry?.name ? ` · ${planEntry.name}` : ""}
              </span>
              {isLimitReached && (
                <button onClick={() => setIsUpgradeOpen(true)} className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 font-medium">
                  <Crown className="w-3 h-3" />
                  {t("limits.upgradeCta")}
                </button>
              )}
            </p>
          </div>
          <Button onClick={() => (isLimitReached ? setIsUpgradeOpen(true) : setIsCreateOpen(true))}>
            <Plus className="w-4 h-4 mr-2" />
            {t("buttons.addUser")}
          </Button>
        </div>

        {isLimitReached && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-4 flex items-center justify-between">
              <p className="text-sm text-amber-800">
                {t("limits.reached", { max: maxUsers })}
              </p>
              <Button size="sm" variant="outline" onClick={() => setIsUpgradeOpen(true)} className="border-amber-300 text-amber-700 hover:bg-amber-100">
                <Crown className="w-4 h-4 mr-1" />
                {t("limits.upgradeCta")}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Users List */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>{t("list.title")}</CardTitle>
            <CardDescription>{t("list.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : users?.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {t("empty.title")}
                </h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-6">
                  {t("empty.description")}
                </p>
                <Button onClick={() => (isLimitReached ? setIsUpgradeOpen(true) : setIsCreateOpen(true))}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t("buttons.addUser")}
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {users?.map((row) => {
                  const isSelf = row.id === user?.userId;
                  const deleteDisabled = isSelf || !row.active;
                  const deleteDisabledReason = isSelf
                    ? t("list.actions.deleteSelfDisabled")
                    : !row.active
                      ? t("list.actions.deleteInactiveDisabled")
                      : undefined;

                  return (
                    <div
                      key={row.id}
                      className="flex items-center justify-between gap-3 p-4 hover:bg-slate-50 transition-colors rounded-lg group"
                    >
                      <Link
                        href={`/dashboard/users/${row.id}`}
                        className="flex items-center gap-4 flex-1 min-w-0"
                      >
                        <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                          {row.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {row.name}
                          </h3>
                          <p className="text-sm text-slate-500 truncate">{row.email}</p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge
                          variant="outline"
                          className={cn(getRoleBadgeColor(row.role))}
                        >
                          {t(`roles.${row.role}`)}
                        </Badge>
                        <Badge
                          variant={row.active ? "default" : "secondary"}
                          className={cn(
                            row.active
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                          )}
                        >
                          {row.active
                            ? tc("status.active")
                            : tc("status.inactive")}
                        </Badge>
                        <div className="flex items-center gap-1 pl-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            title={t("list.actions.edit")}
                          >
                            <Link href={`/dashboard/users/${row.id}`}>
                              <Pencil className="w-4 h-4 text-slate-500" />
                              <span className="sr-only">{t("list.actions.edit")}</span>
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deleteDisabled}
                            title={deleteDisabledReason ?? t("list.actions.delete")}
                            onClick={() => setDeleteTarget(row)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                            <span className="sr-only">{t("list.actions.delete")}</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateUserDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <UpgradePlanModal open={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description", { name: deleteTarget?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUser.isPending}>
              {tc("buttons.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={deleteUser.isPending}
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
            >
              {deleteUser.isPending ? tc("buttons.deleting") : t("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

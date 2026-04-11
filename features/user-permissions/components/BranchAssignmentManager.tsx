"use client";

import { memo, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Building2,
  Plus,
  Trash2,
  UserCheck,
  AlertCircle,
  Loader2,
  MapPin,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranches } from "@/features/branches/hooks/useBranches";
import {
  useUserBranchAssignments,
  useAssignToBranch,
  useRemoveFromBranch,
} from "../hooks";
import type { UserBranchAssignment } from "../types";

interface BranchAssignmentManagerProps {
  userId: string;
}

/**
 * Componente para gestionar las asignaciones de sucursales de un usuario
 *
 * Permite:
 * - Ver las sucursales asignadas actualmente
 * - Agregar nuevas asignaciones con selector de sucursal y rol
 * - Eliminar asignaciones existentes
 */
export const BranchAssignmentManager = memo(function BranchAssignmentManager({
  userId,
}: BranchAssignmentManagerProps) {
  const t = useTranslations("userPermissions");
  const tCommon = useTranslations("common");

  const { data: assignments, isLoading: isLoadingAssignments } = useUserBranchAssignments(userId);
  const { data: branches, isLoading: isLoadingBranches } = useBranches();
  const assignMutation = useAssignToBranch(userId);
  const removeMutation = useRemoveFromBranch(userId);

  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [role, setRole] = useState<string>("BRANCH_OPERATOR");
  const [assignmentToRemove, setAssignmentToRemove] = useState<UserBranchAssignment | null>(null);

  // Filtrar sucursales ya asignadas
  const availableBranches = branches?.filter(
    (branch) => !assignments?.some((a) => a.branchId === branch.id)
  );

  /**
   * Obtiene la etiqueta traducida para un rol
   */
  const getRoleLabel = (roleValue: string): string => {
    const roleMap: Record<string, string> = {
      BRANCH_MANAGER: t("roles.branchManager"),
      BRANCH_OPERATOR: t("roles.branchOperator"),
      BRANCH_VIEWER: t("roles.branchViewer"),
    };
    return roleMap[roleValue] || roleValue;
  };

  const handleAssign = useCallback(() => {
    if (!selectedBranchId || !role) return;

    assignMutation.mutate(
      { branchId: selectedBranchId, role },
      {
        onSuccess: () => {
          setSelectedBranchId("");
          setRole("BRANCH_OPERATOR");
        },
      }
    );
  }, [selectedBranchId, role, assignMutation]);

  const handleRemove = useCallback(() => {
    if (!assignmentToRemove) return;

    removeMutation.mutate(assignmentToRemove.branchId, {
      onSuccess: () => {
        setAssignmentToRemove(null);
      },
    });
  }, [assignmentToRemove, removeMutation]);

  const isLoading = isLoadingAssignments || isLoadingBranches;
  const isMutating = assignMutation.isPending || removeMutation.isPending;

  // Obtener color según el rol
  const getRoleBadgeClass = (roleValue: string) => {
    switch (roleValue.toUpperCase()) {
      case "BRANCH_MANAGER":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "BRANCH_OPERATOR":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "BRANCH_VIEWER":
        return "bg-slate-100 text-slate-700 border-slate-200";
      // Legacy role support
      case "ADMIN":
        return "bg-red-100 text-red-700 border-red-200";
      case "MANAGER":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "OPERATOR":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <Card variant="glass" className={cn(isMutating && "opacity-90")}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg">{t("branchAssignments.title")}</CardTitle>
            <CardDescription>{t("branchAssignments.description")}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Formulario para agregar asignación */}
        <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200 space-y-4">
          <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t("addAssignment")}
          </h4>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Selector de sucursal */}
            <div className="space-y-2">
              <Label htmlFor="branch-select">{t("fields.branch")}</Label>
              <Select
                value={selectedBranchId}
                onValueChange={setSelectedBranchId}
                disabled={isLoading || !availableBranches?.length}
              >
                <SelectTrigger id="branch-select">
                  <SelectValue placeholder={t("placeholders.selectBranch")} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingBranches ? (
                    <SelectItem value="loading" disabled>
                      {tCommon("status.loading")}
                    </SelectItem>
                  ) : availableBranches?.length === 0 ? (
                    <SelectItem value="none" disabled>
                      {t("noAvailableBranches")}
                    </SelectItem>
                  ) : (
                    availableBranches?.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {branch.name}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Selector de rol */}
            <div className="space-y-2">
              <Label htmlFor="role-select">{t("fields.role")}</Label>
              <Select value={role} onValueChange={setRole} disabled={isMutating}>
                <SelectTrigger id="role-select">
                  <SelectValue placeholder={t("placeholders.selectRole")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRANCH_OPERATOR">{t("roles.branchOperator")}</SelectItem>
                  <SelectItem value="BRANCH_MANAGER">{t("roles.branchManager")}</SelectItem>
                  <SelectItem value="BRANCH_VIEWER">{t("roles.branchViewer")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleAssign}
            disabled={!selectedBranchId || !role || assignMutation.isPending}
            className="w-full sm:w-auto"
          >
            {assignMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {tCommon("buttons.saving")}
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 mr-2" />
                {t("buttons.assign")}
              </>
            )}
          </Button>
        </div>

        {/* Lista de asignaciones */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700">
            {t("currentAssignments")} ({assignments?.length || 0})
          </h4>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="w-full h-16" />
              <Skeleton className="w-full h-16" />
            </div>
          ) : assignments?.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-200 rounded-lg">
              <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-slate-500">{t("noAssignments")}</p>
              <p className="text-sm text-slate-400">{t("noAssignmentsDescription")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {assignments?.map((assignment) => (
                <div
                  key={assignment.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-colors",
                    assignment.id.startsWith("temp-")
                      ? "bg-blue-50/50 border-blue-200"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "p-2 rounded-lg shrink-0",
                        assignment.id.startsWith("temp-")
                          ? "bg-blue-100"
                          : "bg-slate-100"
                      )}
                    >
                      {assignment.id.startsWith("temp-") ? (
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      ) : (
                        <Building2 className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {assignment.branchName}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Briefcase className="w-3.5 h-3.5" />
                        <Badge
                          variant="outline"
                          className={cn("text-xs", getRoleBadgeClass(assignment.role))}
                        >
                          {getRoleLabel(assignment.role)}
                        </Badge>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs">
                          {t("assignedAt")}: {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString() : "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!assignment.id.startsWith("temp-") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
                      onClick={() => setAssignmentToRemove(assignment)}
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog
        open={!!assignmentToRemove}
        onOpenChange={() => setAssignmentToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              {t("remove.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("remove.description", { branchName: assignmentToRemove?.branchName ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMutation.isPending}>
              {tCommon("buttons.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={handleRemove}
              disabled={removeMutation.isPending}
            >
              {removeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {tCommon("buttons.deleting")}
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {tCommon("buttons.delete")}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
});

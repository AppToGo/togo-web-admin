/**
 * Assign to Branch Hook
 *
 * Hook para asignar un usuario a una sucursal con optimistic UI.
 * - Crea la asignación en el backend
 * - Invalidación automática de queries
 * - Toast notifications con sonner
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { assignToBranch } from "../services/user-permissions.service";
import { USER_PERMISSIONS_KEYS } from "./query-keys";
import type { AssignToBranchRequest, UserBranchAssignment } from "../types";
import { getHumanizedErrorMessage } from "@/lib/error.utils";

/**
 * Hook para asignar un usuario a una sucursal
 *
 * Implementa optimistic UI con rollback automático en caso de error.
 *
 * @param userId - ID del usuario a asignar
 * @returns Mutation result para asignar a sucursal
 */
export function useAssignToBranch(userId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations("userPermissions");

  return useMutation({
    mutationFn: (data: AssignToBranchRequest) => assignToBranch(userId, data),

    // Optimistic update
    onMutate: async (data) => {
      // Cancelar queries en vuelo
      await queryClient.cancelQueries({ queryKey: USER_PERMISSIONS_KEYS.all });

      // Guardar estado anterior para rollback
      const previousAssignments = queryClient.getQueryData<UserBranchAssignment[]>(
        USER_PERMISSIONS_KEYS.branchAssignments(userId)
      );

      // Crear asignación temporal optimista
      const optimisticAssignment: UserBranchAssignment = {
        id: `temp-${Date.now()}`,
        branchId: data.branchId,
        branchName: t("loading.branchName"),
        role: data.role,
        assignedAt: new Date().toISOString(),
      };

      // Actualizar lista de asignaciones
      queryClient.setQueryData<UserBranchAssignment[]>(
        USER_PERMISSIONS_KEYS.branchAssignments(userId),
        (old: UserBranchAssignment[] | undefined) => {
          if (!old) return [optimisticAssignment];
          return [...old, optimisticAssignment];
        }
      );

      return { previousAssignments };
    },

    // Rollback on error
    onError: (err, _variables, context) => {
      if (context?.previousAssignments) {
        queryClient.setQueryData(
          USER_PERMISSIONS_KEYS.branchAssignments(userId),
          context.previousAssignments
        );
      }

      // Mostrar error
      const errorMessage = getHumanizedErrorMessage(err);
      toast.error(errorMessage || t("errors.assignFailed"));
    },

    // Success
    onSuccess: () => {
      toast.success(t("assignSuccess"));
    },

    // Revalidar después de la mutación
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: USER_PERMISSIONS_KEYS.branchAssignments(userId),
      });
    },
  });
}

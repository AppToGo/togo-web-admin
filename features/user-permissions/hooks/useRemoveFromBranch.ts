/**
 * Remove from Branch Hook
 *
 * Hook para remover un usuario de una sucursal con optimistic UI.
 * - Elimina la asignación en el backend
 * - Invalidación automática de queries
 * - Toast notifications con sonner
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { removeFromBranch } from "../services/user-permissions.service";
import { USER_PERMISSIONS_KEYS } from "./query-keys";
import type { UserBranchAssignment } from "../types";
import { getHumanizedErrorMessage } from "@/lib/error.utils";

/**
 * Hook para remover un usuario de una sucursal
 *
 * Implementa optimistic UI con rollback automático en caso de error.
 *
 * @param userId - ID del usuario a remover
 * @returns Mutation result para remover de sucursal
 */
export function useRemoveFromBranch(userId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations("userPermissions");

  return useMutation({
    mutationFn: (branchId: string) => removeFromBranch(userId, branchId),

    // Optimistic update
    onMutate: async (branchId) => {
      // Cancelar queries en vuelo
      await queryClient.cancelQueries({ queryKey: USER_PERMISSIONS_KEYS.all });

      // Guardar estado anterior para rollback
      const previousAssignments = queryClient.getQueryData<UserBranchAssignment[]>(
        USER_PERMISSIONS_KEYS.branchAssignments(userId)
      );

      // Remover asignación de la lista optimistamente
      queryClient.setQueryData<UserBranchAssignment[]>(
        USER_PERMISSIONS_KEYS.branchAssignments(userId),
        (old: UserBranchAssignment[] | undefined) => {
          if (!old) return old;
          return old.filter((a) => a.branchId !== branchId);
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
      toast.error(errorMessage || t("errors.removeFailed"));
    },

    // Success
    onSuccess: () => {
      toast.success(t("removeSuccess"));
    },

    // Revalidar después de la mutación
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: USER_PERMISSIONS_KEYS.branchAssignments(userId),
      });
    },
  });
}

/**
 * Assign Permissions Hook
 *
 * Hook para asignar permisos a un perfil de operador con optimistic UI.
 * - Actualiza los permisos en el backend
 * - Invalidación automática de listas y detalle
 * - Toast notifications con sonner
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { assignPermissions } from "../services/operator-profile.service";
import { OPERATOR_PROFILES_KEYS } from "./query-keys";
import { USER_PERMISSIONS_KEYS } from "@/features/user-permissions/hooks/query-keys";
import type { AssignPermissionsRequest, OperatorProfile, ProfilePermission } from "../types";
import { getHumanizedErrorMessage } from "@/lib/error.utils";

/**
 * Hook para asignar permisos a un perfil de operador
 *
 * Implementa optimistic UI con rollback automático en caso de error.
 */
export function useAssignPermissions() {
  const queryClient = useQueryClient();
  const t = useTranslations("operatorProfiles");

  return useMutation({
    mutationFn: ({
      profileId,
      data,
    }: {
      profileId: string;
      data: AssignPermissionsRequest;
    }) => assignPermissions(profileId, data),

    // Optimistic update
    onMutate: async ({ profileId, data }) => {
      // Cancelar queries en vuelo
      await queryClient.cancelQueries({ queryKey: OPERATOR_PROFILES_KEYS.all });

      // Guardar estado anterior para rollback
      const previousProfiles = queryClient.getQueryData<OperatorProfile[]>(
        OPERATOR_PROFILES_KEYS.lists()
      );
      const previousProfile = queryClient.getQueryData<OperatorProfile>(
        OPERATOR_PROFILES_KEYS.detail(profileId)
      );

      // Transformar los permisos del request al formato de ProfilePermission
      const optimisticPermissions: ProfilePermission[] = data.permissions.map(
        (perm, index) => ({
          id: `temp-${Date.now()}-${index}`,
          permissionCode: perm.permissionCode,
          params: perm.params as Record<string, unknown> | undefined,
        })
      );

      // Actualizar lista de perfiles
      queryClient.setQueriesData<OperatorProfile[]>(
        { queryKey: OPERATOR_PROFILES_KEYS.lists() },
        (old: OperatorProfile[] | undefined) => {
          if (!old) return old;
          return old.map((profile) =>
            profile.id === profileId
              ? { ...profile, permissions: optimisticPermissions }
              : profile
          );
        }
      );

      // Actualizar detalle del perfil
      queryClient.setQueryData<OperatorProfile>(
        OPERATOR_PROFILES_KEYS.detail(profileId),
        (old) => {
          if (!old) return old;
          return { ...old, permissions: optimisticPermissions };
        }
      );

      return { previousProfiles, previousProfile };
    },

    // Rollback on error
    onError: (err, { profileId }, context) => {
      if (context?.previousProfiles) {
        queryClient.setQueryData(
          OPERATOR_PROFILES_KEYS.lists(),
          context.previousProfiles
        );
      }
      if (context?.previousProfile) {
        queryClient.setQueryData(
          OPERATOR_PROFILES_KEYS.detail(profileId),
          context.previousProfile
        );
      }

      // Mostrar error
      const errorMessage = getHumanizedErrorMessage(err);
      toast.error(errorMessage || t("errors.assignPermissionsFailed"));
    },

    // Success
    onSuccess: (updatedProfile) => {
      toast.success(t("assignPermissionsSuccess", { name: updatedProfile.name }));
    },

    // Revalidar después de la mutación
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: OPERATOR_PROFILES_KEYS.all,
      });
      // Invalidate user permissions for all users with this profile
      queryClient.invalidateQueries({
        queryKey: USER_PERMISSIONS_KEYS.all,
      });
    },
  });
}

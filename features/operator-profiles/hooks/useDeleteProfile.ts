/**
 * Delete Profile Hook
 *
 * Hook para eliminar un perfil de operador con optimistic UI.
 * - Elimina el perfil en el backend
 * - Invalidación automática de queries
 * - Toast notifications con sonner
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { deleteOperatorProfile } from "../services/operator-profile.service";
import { OPERATOR_PROFILES_KEYS } from "./query-keys";
import type { OperatorProfile } from "../types";
import { getHumanizedErrorMessage } from "@/lib/error.utils";

/**
 * Hook para eliminar un perfil de operador
 *
 * Implementa optimistic UI con rollback automático en caso de error.
 */
export function useDeleteProfile() {
  const queryClient = useQueryClient();
  const t = useTranslations("operatorProfiles");

  return useMutation({
    mutationFn: (profileId: string) => deleteOperatorProfile(profileId),

    // Optimistic update
    onMutate: async (profileId) => {
      // Cancelar queries en vuelo
      await queryClient.cancelQueries({ queryKey: OPERATOR_PROFILES_KEYS.all });

      // Guardar estado anterior para rollback
      const previousProfiles = queryClient.getQueryData<OperatorProfile[]>(
        OPERATOR_PROFILES_KEYS.lists()
      );
      const deletedProfile = queryClient.getQueryData<OperatorProfile>(
        OPERATOR_PROFILES_KEYS.detail(profileId)
      );

      // Eliminar perfil de la lista
      queryClient.setQueryData<OperatorProfile[]>(
        OPERATOR_PROFILES_KEYS.lists(),
        (old: OperatorProfile[] | undefined) => {
          if (!old) return old;
          return old.filter((profile) => profile.id !== profileId);
        }
      );

      // Invalidar detalle
      queryClient.removeQueries({ queryKey: OPERATOR_PROFILES_KEYS.detail(profileId) });

      return { previousProfiles, deletedProfile };
    },

    // Rollback on error
    onError: (err, profileId, context) => {
      if (context?.previousProfiles) {
        queryClient.setQueryData(
          OPERATOR_PROFILES_KEYS.lists(),
          context.previousProfiles
        );
      }
      if (context?.deletedProfile) {
        queryClient.setQueryData(
          OPERATOR_PROFILES_KEYS.detail(profileId),
          context.deletedProfile
        );
      }

      // Mostrar error
      const errorMessage = getHumanizedErrorMessage(err);
      toast.error(errorMessage || t("errors.deleteFailed"));
    },

    // Success
    onSuccess: () => {
      toast.success(t("deleteSuccess"));
    },

    // Revalidar después de la mutación
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: OPERATOR_PROFILES_KEYS.lists() });
    },
  });
}

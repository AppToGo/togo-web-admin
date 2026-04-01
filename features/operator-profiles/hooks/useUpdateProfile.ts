/**
 * Update Profile Hook
 *
 * Hook para actualizar un perfil de operador existente con optimistic UI.
 * - Actualiza el perfil en el backend
 * - Invalidación automática de listas y detalle
 * - Toast notifications con sonner
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateOperatorProfile } from "../services/operator-profile.service";
import { OPERATOR_PROFILES_KEYS } from "./query-keys";
import type { UpdateProfileRequest, OperatorProfile } from "../types";
import { getHumanizedErrorMessage } from "@/lib/error.utils";

/**
 * Hook para actualizar un perfil de operador existente
 *
 * Implementa optimistic UI con rollback automático en caso de error.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const t = useTranslations("operatorProfiles");

  return useMutation({
    mutationFn: ({
      profileId,
      data,
    }: {
      profileId: string;
      data: UpdateProfileRequest;
    }) => updateOperatorProfile(profileId, data),

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

      // Actualizar lista de perfiles
      queryClient.setQueriesData<OperatorProfile[]>(
        { queryKey: OPERATOR_PROFILES_KEYS.lists() },
        (old: OperatorProfile[] | undefined) => {
          if (!old) return old;
          return old.map((profile) =>
            profile.id === profileId ? { ...profile, ...data } : profile
          );
        }
      );

      // Actualizar detalle del perfil
      queryClient.setQueryData<OperatorProfile>(
        OPERATOR_PROFILES_KEYS.detail(profileId),
        (old) => {
          if (!old) return old;
          return { ...old, ...data };
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
      toast.error(errorMessage || t("errors.updateFailed"));
    },

    // Success
    onSuccess: (updatedProfile) => {
      toast.success(t("updateSuccess", { name: updatedProfile.name }));
    },

    // Revalidar después de la mutación
    onSettled: (_data, _error, { profileId }) => {
      queryClient.invalidateQueries({ queryKey: OPERATOR_PROFILES_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: OPERATOR_PROFILES_KEYS.detail(profileId),
      });
    },
  });
}

/**
 * Clone Profile Hook
 *
 * Hook para clonar un perfil de operador existente con optimistic UI.
 * - Clona el perfil en el backend con nuevos permisos
 * - Invalidación automática de queries
 * - Toast notifications con sonner
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cloneOperatorProfile } from "../services/operator-profile.service";
import { OPERATOR_PROFILES_KEYS } from "./query-keys";
import type { CloneProfileRequest, OperatorProfile } from "../types";
import { getHumanizedErrorMessage } from "@/lib/error.utils";

/**
 * Hook para clonar un perfil de operador existente
 *
 * Implementa optimistic UI con rollback automático en caso de error.
 */
export function useCloneProfile() {
  const queryClient = useQueryClient();
  const t = useTranslations("operatorProfiles");

  return useMutation({
    mutationFn: ({
      profileId,
      data,
    }: {
      profileId: string;
      data: CloneProfileRequest;
    }) => cloneOperatorProfile(profileId, data),

    // Optimistic update
    onMutate: async ({ profileId, data }) => {
      // Cancelar queries en vuelo
      await queryClient.cancelQueries({ queryKey: OPERATOR_PROFILES_KEYS.all });

      // Guardar estado anterior para rollback
      const previousProfiles = queryClient.getQueryData<OperatorProfile[]>(
        OPERATOR_PROFILES_KEYS.lists()
      );

      // Obtener el perfil original para copiar sus datos
      const originalProfile = queryClient.getQueryData<OperatorProfile>(
        OPERATOR_PROFILES_KEYS.detail(profileId)
      );

      // Crear perfil clonado temporal optimista
      const optimisticClonedProfile: OperatorProfile = {
        id: `temp-${Date.now()}`,
        businessId: originalProfile?.businessId || "",
        name: data.name,
        permissions: originalProfile?.permissions || [],
        userCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Actualizar lista de perfiles
      queryClient.setQueryData<OperatorProfile[]>(
        OPERATOR_PROFILES_KEYS.lists(),
        (old: OperatorProfile[] | undefined) => {
          if (!old) return [optimisticClonedProfile];
          return [...old, optimisticClonedProfile];
        }
      );

      return { previousProfiles };
    },

    // Rollback on error
    onError: (err, _variables, context) => {
      if (context?.previousProfiles) {
        queryClient.setQueryData(
          OPERATOR_PROFILES_KEYS.lists(),
          context.previousProfiles
        );
      }

      // Mostrar error
      const errorMessage = getHumanizedErrorMessage(err);
      toast.error(errorMessage || t("errors.cloneFailed"));
    },

    // Success
    onSuccess: (clonedProfile) => {
      toast.success(t("cloneSuccess", { name: clonedProfile.name }));
    },

    // Revalidar después de la mutación
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: OPERATOR_PROFILES_KEYS.lists() });
    },
  });
}

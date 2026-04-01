/**
 * Create Profile Hook
 *
 * Hook para crear un nuevo perfil de operador con optimistic UI.
 * - Crea el perfil en el backend
 * - Invalidación automática de queries
 * - Toast notifications con sonner
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createOperatorProfile } from "../services/operator-profile.service";
import { OPERATOR_PROFILES_KEYS } from "./query-keys";
import type { CreateProfileRequest, OperatorProfile } from "../types";
import { getHumanizedErrorMessage } from "@/lib/error.utils";

/**
 * Hook para crear un nuevo perfil de operador
 *
 * Implementa optimistic UI con rollback automático en caso de error.
 */
export function useCreateProfile() {
  const queryClient = useQueryClient();
  const t = useTranslations("operatorProfiles");

  return useMutation({
    mutationFn: (data: CreateProfileRequest) => createOperatorProfile(data),

    // Optimistic update
    onMutate: async (data) => {
      // Cancelar queries en vuelo
      await queryClient.cancelQueries({ queryKey: OPERATOR_PROFILES_KEYS.all });

      // Guardar estado anterior para rollback
      const previousProfiles = queryClient.getQueryData<OperatorProfile[]>(
        OPERATOR_PROFILES_KEYS.lists()
      );

      // Crear perfil temporal optimista
      const optimisticProfile: OperatorProfile = {
        id: `temp-${Date.now()}`,
        businessId: "", // Se asigna en el backend
        name: data.name,
        permissions: [], // Los permisos se asignan después de la creación
        userCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Actualizar lista de perfiles
      queryClient.setQueryData<OperatorProfile[]>(
        OPERATOR_PROFILES_KEYS.lists(),
        (old: OperatorProfile[] | undefined) => {
          if (!old) return [optimisticProfile];
          return [...old, optimisticProfile];
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
      toast.error(errorMessage || t("errors.createFailed"));
    },

    // Success
    onSuccess: (newProfile) => {
      toast.success(t("createSuccess", { name: newProfile.name }));
    },

    // Revalidar después de la mutación
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: OPERATOR_PROFILES_KEYS.lists() });
      // Also invalidate any detail queries that might exist
      queryClient.invalidateQueries({ queryKey: OPERATOR_PROFILES_KEYS.all });
    },
  });
}

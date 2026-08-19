/**
 * Operator Profiles List Hook
 *
 * Hook para obtener todos los perfiles de operadores del negocio actual
 * usando TanStack Query.
 */

import { useQuery } from "@tanstack/react-query";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { getOperatorProfiles } from "../services/operator-profile.service";
import { OPERATOR_PROFILES_KEYS, STALE_TIME, GC_TIME } from "./query-keys";
import type { OperatorProfile } from "../types";

/**
 * Hook para obtener todos los perfiles de operadores del negocio actual
 *
 * Solo se ejecuta cuando hay un businessId concreto resuelto (del usuario
 * autenticado o del negocio seleccionado por SUPER_ADMIN). "" (todos los
 * negocios) también deshabilita la query — no hay un único listado de
 * perfiles que mostrar ahí.
 */
export function useOperatorProfiles() {
  const businessId = useEffectiveBusinessId();

  return useQuery<OperatorProfile[], Error>({
    queryKey: OPERATOR_PROFILES_KEYS.lists(businessId),
    queryFn: getOperatorProfiles,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: !!businessId,
    retry: (failureCount, error) => {
      // No reintentar en errores 401 o 403
      if (error instanceof Error) {
        const message = error.message;
        if (message.includes("401") || message.includes("403")) {
          return false;
        }
      }
      return failureCount < 3;
    },
  });
}

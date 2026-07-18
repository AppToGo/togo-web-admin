/**
 * Operator Profiles List Hook
 *
 * Hook para obtener todos los perfiles de operadores del negocio actual
 * usando TanStack Query.
 */

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useBusinessStore } from "@/features/business/stores/business.store";
import { getOperatorProfiles } from "../services/operator-profile.service";
import { OPERATOR_PROFILES_KEYS, STALE_TIME, GC_TIME } from "./query-keys";
import type { OperatorProfile } from "../types";

/**
 * Hook para obtener todos los perfiles de operadores del negocio actual
 *
 * Solo se ejecuta cuando el usuario tiene un businessId válido
 * (ya sea del usuario autenticado o del negocio seleccionado por SUPER_ADMIN)
 */
export function useOperatorProfiles() {
  const user = useAuthStore((state) => state.user);
  const { selectedBusinessId } = useBusinessStore();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const hasBusinessId = !!user?.businessId;
  const hasSelectedBusiness = !!selectedBusinessId;

  // Habilitar query si:
  // - Usuario normal con businessId asignado
  // - SUPER_ADMIN con un negocio seleccionado
  const isEnabled = isSuperAdmin ? hasSelectedBusiness : hasBusinessId;

  return useQuery<OperatorProfile[], Error>({
    queryKey: OPERATOR_PROFILES_KEYS.lists(),
    queryFn: getOperatorProfiles,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: isEnabled,
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

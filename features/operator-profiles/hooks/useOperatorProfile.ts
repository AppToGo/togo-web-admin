/**
 * Single Operator Profile Hook
 *
 * Hook para obtener un perfil de operador específico por ID
 * usando TanStack Query.
 */

import { useQuery } from "@tanstack/react-query";
import { getOperatorProfileById } from "../services/operator-profile.service";
import { OPERATOR_PROFILES_KEYS, STALE_TIME, GC_TIME } from "./query-keys";
import type { OperatorProfile } from "../types";

/**
 * Hook para obtener un perfil de operador específico por ID
 *
 * @param id - ID del perfil de operador (null para no ejecutar la query)
 * @param enabled - Si la query está habilitada (default: true)
 */
export function useOperatorProfile(id: string | null, enabled: boolean = true) {
  return useQuery<OperatorProfile, Error>({
    queryKey: OPERATOR_PROFILES_KEYS.detail(id || ""),
    queryFn: () => getOperatorProfileById(id!),
    enabled: !!id && enabled,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

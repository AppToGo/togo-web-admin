/**
 * Permission Catalog Hook
 *
 * Hook para obtener el catálogo de permisos disponibles en el sistema
 * usando TanStack Query.
 */

import { useQuery } from "@tanstack/react-query";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { getPermissionCatalog } from "../services/operator-profile.service";
import { OPERATOR_PROFILES_KEYS } from "./query-keys";
import type { PermissionCatalog } from "../types";

/**
 * Hook para obtener el catálogo de permisos disponibles en el sistema
 *
 * Los permisos son relativamente estáticos, por lo que usamos un staleTime mayor.
 */
export function usePermissionCatalog() {
  const businessId = useEffectiveBusinessId();

  return useQuery<PermissionCatalog[], Error>({
    queryKey: OPERATOR_PROFILES_KEYS.catalog(businessId),
    queryFn: getPermissionCatalog,
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

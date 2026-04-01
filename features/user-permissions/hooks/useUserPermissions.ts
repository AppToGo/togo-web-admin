/**
 * User Permissions Hook
 *
 * Hook para obtener los permisos computados de un usuario específico
 * usando TanStack Query.
 */

import { useQuery } from "@tanstack/react-query";
import { getUserPermissions } from "../services/user-permissions.service";
import { USER_PERMISSIONS_KEYS, STALE_TIME, GC_TIME } from "./query-keys";
import type { UserPermissions } from "../types";

/**
 * Hook para obtener los permisos de un usuario
 *
 * @param userId - ID del usuario (null para no ejecutar la query)
 * @param enabled - Si la query está habilitada (default: true)
 * @returns Query result con los permisos del usuario
 */
export function useUserPermissions(userId: string | null, enabled: boolean = true) {
  return useQuery<UserPermissions, Error>({
    queryKey: USER_PERMISSIONS_KEYS.permissions(userId || ""),
    queryFn: () => getUserPermissions(userId!),
    enabled: !!userId && enabled,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

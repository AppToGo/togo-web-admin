/**
 * User Branch Assignments Hook
 *
 * Hook para obtener las asignaciones de sucursales de un usuario específico
 * usando TanStack Query.
 */

import { useQuery } from "@tanstack/react-query";
import { getUserBranchAssignments } from "../services/user-permissions.service";
import { USER_PERMISSIONS_KEYS, STALE_TIME, GC_TIME } from "./query-keys";
import type { UserBranchAssignment } from "../types";

/**
 * Hook para obtener las asignaciones de sucursales de un usuario
 *
 * @param userId - ID del usuario (null para no ejecutar la query)
 * @param enabled - Si la query está habilitada (default: true)
 * @returns Query result con las asignaciones del usuario
 */
export function useUserBranchAssignments(userId: string | null, enabled: boolean = true) {
  return useQuery<UserBranchAssignment[], Error>({
    queryKey: USER_PERMISSIONS_KEYS.branchAssignments(userId || ""),
    queryFn: () => getUserBranchAssignments(userId!),
    enabled: !!userId && enabled,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

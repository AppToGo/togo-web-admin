/**
 * User Permissions Query Keys
 *
 * Query keys centralizados para mantener consistencia
 * en el cache de TanStack Query para permisos de usuarios.
 */

export const USER_PERMISSIONS_KEYS = {
  all: ["user-permissions"] as const,
  permissions: (userId: string) => [...USER_PERMISSIONS_KEYS.all, "permissions", userId] as const,
  branchAssignments: (userId: string) => [...USER_PERMISSIONS_KEYS.all, "branch-assignments", userId] as const,
};

// Stale times configurables
export const STALE_TIME = 30 * 1000; // 30 seconds
export const GC_TIME = 5 * 60 * 1000; // 5 minutes

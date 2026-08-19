/**
 * Operator Profiles Query Keys
 *
 * Query keys centralizados para mantener consistencia
 * en el cache de TanStack Query para perfiles de operadores.
 */

// lists/catalog se cachean por businessId: sin esto, un SUPER_ADMIN que
// cambia de negocio seleccionado (BusinessSelector) seguía viendo los
// perfiles operativos (y su catálogo de permisos) del negocio anterior
// hasta que expirara el staleTime, porque la query key era la misma sin
// importar qué negocio estuviera activo — el mismo bug que se corrigió
// para USERS_KEYS.lists() en features/users/hooks/useUsers.ts.
//
// Los hooks de mutación (useCreateProfile, useUpdateProfile,
// useDeleteProfile, useCloneProfile, useAssignPermissions) leen/escriben
// esta key exacta para sus actualizaciones optimistas — deben pasar el
// mismo businessId que usa useOperatorProfiles(), o el optimismo se
// vuelve un no-op silencioso contra una key que no existe en caché.
export const OPERATOR_PROFILES_KEYS = {
  all: ["operator-profiles"] as const,
  lists: (businessId?: string | null) =>
    [...OPERATOR_PROFILES_KEYS.all, "list", businessId ?? null] as const,
  detail: (id: string) => [...OPERATOR_PROFILES_KEYS.all, "detail", id] as const,
  catalog: (businessId?: string | null) =>
    [...OPERATOR_PROFILES_KEYS.all, "catalog", businessId ?? null] as const,
};

// Stale times configurables
export const STALE_TIME = 30 * 1000; // 30 seconds
export const GC_TIME = 5 * 60 * 1000; // 5 minutes

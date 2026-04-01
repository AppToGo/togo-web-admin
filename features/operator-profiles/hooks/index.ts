/**
 * Operator Profiles Hooks
 *
 * Exportación centralizada de todos los hooks para la gestión de perfiles de operadores.
 */

// Query hooks
export { useOperatorProfiles } from "./useOperatorProfiles";
export { useOperatorProfile } from "./useOperatorProfile";
export { usePermissionCatalog } from "./usePermissionCatalog";

// Mutation hooks
export { useCreateProfile } from "./useCreateProfile";
export { useUpdateProfile } from "./useUpdateProfile";
export { useDeleteProfile } from "./useDeleteProfile";
export { useCloneProfile } from "./useCloneProfile";
export { useAssignPermissions } from "./useAssignPermissions";

// Query keys
export { OPERATOR_PROFILES_KEYS, STALE_TIME, GC_TIME } from "./query-keys";

/**
 * Branches Hooks
 *
 * Exportación centralizada de todos los hooks para la feature de sucursales.
 */

// Query hooks
export {
  useBranches,
  useBranch,
  useCanCreateBranch,
  useSelectedBranch,
  useUserBranches,
  type UserBranchAssignment,
  type BusinessInfo,
} from "./useBranches";

// Mutation hooks
export {
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
  useSetMainBranch,
} from "./useBranchMutations";

// Query keys (para uso avanzado)
export { BRANCHES_KEYS, STALE_TIME, GC_TIME } from "./query-keys";

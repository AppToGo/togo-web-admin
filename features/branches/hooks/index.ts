/**
 * Branches Hooks
 *
 * Exportación centralizada de todos los hooks para la feature de sucursales.
 */

// Query hooks
export {
  useBranches,
  useBranchesByBusiness,
  useBranch,
  useCanCreateBranch,
  useSelectedBranch,
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
export { useEffectiveBranches } from "./useEffectiveBranches";
export { useSingleBranchInit } from "./useSingleBranchInit";

// Branch mode hooks
export {
  useBranchMode,
  useMainBranch,
  useIsMultiBranch,
  useBranchCount,
  type SingleBranchMode,
  type MultiBranchMode,
} from "./useBranchMode";

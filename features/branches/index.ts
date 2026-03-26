/**
 * Branches Feature
 *
 * Gestión de sedes para negocios multi-locación.
 * Permite crear, editar y administrar múltiples sucursales.
 */

// Types
export * from "./types";

// Utils
export * from "./utils/branch-helpers";

// Components
export { BranchCard } from "./components/branch-card";
export { BranchForm } from "./components/branch-form";
export { BranchLimitIndicator } from "./components/branch-limit-indicator";

// Hooks
export {
  useBranches,
  useBranch,
  useCanCreateBranch,
  useSelectedBranch,
} from "./hooks/useBranches";
export {
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
  useSetMainBranch,
} from "./hooks/useBranchMutations";

// Services
export * from "./services/branch.service";

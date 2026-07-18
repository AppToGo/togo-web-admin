/**
 * Operator Profiles Feature
 *
 * Gestión de perfiles de operador y permisos para el sistema TOGO.
 * Permite crear, editar y asignar perfiles con permisos granulares.
 */

// Types
export * from "./types";

// Components
export { OperatorProfileCard } from "./components/OperatorProfileCard";
export { OperatorProfileForm } from "./components/OperatorProfileForm";
export { PermissionSelector } from "./components/PermissionSelector";
export { CloneProfileDialog } from "./components/CloneProfileDialog";

// Hooks
export {
  useOperatorProfiles,
  useOperatorProfile,
  usePermissionCatalog,
} from "./hooks";
export {
  useCreateProfile,
  useUpdateProfile,
  useDeleteProfile,
  useCloneProfile,
  useAssignPermissions,
} from "./hooks";

// Services
export * from "./services/operator-profile.service";

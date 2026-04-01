/**
 * User Permissions Feature
 *
 * Feature completa para la gestión de permisos de usuarios y asignaciones a sucursales.
 *
 * @example
 * ```tsx
 * import { UserPermissionView, BranchAssignmentManager, useUserPermissions } from "@/features/user-permissions";
 *
 * function UserPermissionsPage({ userId }: { userId: string }) {
 *   const { data: permissions, isLoading } = useUserPermissions(userId);
 *
 *   return (
 *     <div className="space-y-6">
 *       <UserPermissionView permissions={permissions} isLoading={isLoading} />
 *       <BranchAssignmentManager userId={userId} />
 *     </div>
 *   );
 * }
 * ```
 */

// Types
export * from "./types";

// Hooks
export * from "./hooks";

// Components
export * from "./components";

// Services
export * from "./services/user-permissions.service";

/**
 * User Permissions Feature Types
 *
 * Tipado estricto para la gestión de permisos de usuarios y asignaciones a sucursales.
 * Basado en los DTOs del backend.
 */

/**
 * Representa los permisos computados de un usuario
 * Incluye el rol, perfil de operador asignado y lista de permisos efectivos
 */
export interface UserPermissions {
  userId: string;
  role: string;
  operatorProfile?: { id: string; name: string };
  permissions: string[];
  computedAt: string;
}

/**
 * Representa una asignación de usuario a una sucursal específica
 */
export interface UserBranchAssignment {
  id: string;
  branchId: string;
  branchName: string;
  role: string;
  assignedAt: string;
}

/**
 * DTO para asignar un usuario a una sucursal
 */
export interface AssignToBranchRequest {
  branchId: string;
  role: string;
}

/**
 * DTO para remover un usuario de una sucursal
 */
export interface RemoveFromBranchRequest {
  branchId: string;
}

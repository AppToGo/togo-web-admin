/**
 * Operator Profiles Feature Types
 *
 * Tipado estricto para la gestión de perfiles de operadores y permisos.
 * Basado en los DTOs del backend.
 */

/**
 * Representa un permiso asignado a un perfil
 */
export interface ProfilePermission {
  id: string;
  permissionCode: string;
  params?: Record<string, unknown>;
}

/**
 * Representa un perfil de operador con sus permisos
 */
export interface OperatorProfile {
  id: string;
  name: string;
  businessId: string;
  permissions: ProfilePermission[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Catálogo de permisos disponibles en el sistema
 */
export interface PermissionCatalog {
  code: string;
  domain: string;
  description: string;
  requiresParams: boolean;
}

/**
 * DTO para crear un nuevo perfil de operador
 */
export interface CreateProfileRequest {
  name: string;
  permissions?: Array<{ permissionCode: string; params?: object }>;
}

/**
 * DTO para actualizar un perfil de operador existente
 */
export interface UpdateProfileRequest {
  name?: string;
}

/**
 * DTO para clonar un perfil de operador
 */
export interface CloneProfileRequest {
  name: string;
}

/**
 * DTO para asignar permisos a un perfil
 */
export interface AssignPermissionsRequest {
  permissions: Array<{ permissionCode: string; params?: object }>;
}

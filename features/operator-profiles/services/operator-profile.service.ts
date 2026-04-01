/**
 * Operator Profile Service
 *
 * Servicios para consumir los endpoints de perfiles de operadores del backend.
 * Gestiona la creación, actualización, clonación y asignación de permisos.
 */

import apiClient from "@/services/api.service";
import type {
  OperatorProfile,
  PermissionCatalog,
  CreateProfileRequest,
  UpdateProfileRequest,
  CloneProfileRequest,
  AssignPermissionsRequest,
} from "../types";

/**
 * Obtener todos los perfiles de operadores del negocio actual
 */
export async function getOperatorProfiles(): Promise<OperatorProfile[]> {
  const { data } = await apiClient.get<OperatorProfile[]>("/operator-profiles");
  return data;
}

/**
 * Obtener un perfil de operador específico por ID
 */
export async function getOperatorProfileById(id: string): Promise<OperatorProfile> {
  const { data } = await apiClient.get<OperatorProfile>(`/operator-profiles/${id}`);
  return data;
}

/**
 * Crear un nuevo perfil de operador
 */
export async function createOperatorProfile(
  request: CreateProfileRequest
): Promise<OperatorProfile> {
  const { data } = await apiClient.post<OperatorProfile>("/operator-profiles", request);
  return data;
}

/**
 * Actualizar un perfil de operador existente
 */
export async function updateOperatorProfile(
  id: string,
  request: UpdateProfileRequest
): Promise<OperatorProfile> {
  const { data } = await apiClient.put<OperatorProfile>(`/operator-profiles/${id}`, request);
  return data;
}

/**
 * Eliminar un perfil de operador
 */
export async function deleteOperatorProfile(id: string): Promise<void> {
  await apiClient.delete(`/operator-profiles/${id}`);
}

/**
 * Clonar un perfil de operador existente
 */
export async function cloneOperatorProfile(
  id: string,
  request: CloneProfileRequest
): Promise<OperatorProfile> {
  const { data } = await apiClient.post<OperatorProfile>(`/operator-profiles/${id}/clone`, request);
  return data;
}

/**
 * Asignar permisos a un perfil de operador
 */
export async function assignPermissions(
  id: string,
  request: AssignPermissionsRequest
): Promise<OperatorProfile> {
  const { data } = await apiClient.put<OperatorProfile>(`/operator-profiles/${id}/permissions`, request);
  return data;
}

/**
 * Obtener el catálogo de permisos disponibles
 */
export async function getPermissionCatalog(): Promise<PermissionCatalog[]> {
  const { data } = await apiClient.get<PermissionCatalog[]>("/operator-profiles/catalog/permissions");
  return data;
}

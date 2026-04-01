/**
 * Operator Profile Service
 *
 * Servicios para consumir los endpoints de perfiles de operadores del backend.
 * Gestiona la creación, actualización, clonación y asignación de permisos.
 */

import apiClient from "@/services/api.service";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import type {
  OperatorProfile,
  PermissionCatalog,
  CreateProfileRequest,
  UpdateProfileRequest,
  CloneProfileRequest,
  AssignPermissionsRequest,
} from "../types";

/**
 * Obtener el businessId del usuario autenticado
 */
function getBusinessId(): string | null {
  const { user } = useAuthStore.getState();
  return user?.businessId ?? null;
}

/**
 * Obtener todos los perfiles de operadores del negocio actual
 */
export async function getOperatorProfiles(): Promise<OperatorProfile[]> {
  const businessId = getBusinessId();
  if (!businessId) throw new Error("Se requiere businessId");
  const { data } = await apiClient.get<OperatorProfile[]>(
    `/businesses/${businessId}/operator-profiles`
  );
  return data;
}

/**
 * Obtener un perfil de operador específico por ID
 */
export async function getOperatorProfileById(id: string): Promise<OperatorProfile> {
  const businessId = getBusinessId();
  if (!businessId) throw new Error("Se requiere businessId");
  const { data } = await apiClient.get<OperatorProfile>(
    `/businesses/${businessId}/operator-profiles/${id}`
  );
  return data;
}

/**
 * Crear un nuevo perfil de operador
 */
export async function createOperatorProfile(
  request: CreateProfileRequest
): Promise<OperatorProfile> {
  const businessId = getBusinessId();
  if (!businessId) throw new Error("Se requiere businessId");
  const { data } = await apiClient.post<OperatorProfile>(
    `/businesses/${businessId}/operator-profiles`,
    request
  );
  return data;
}

/**
 * Actualizar un perfil de operador existente
 */
export async function updateOperatorProfile(
  id: string,
  request: UpdateProfileRequest
): Promise<OperatorProfile> {
  const businessId = getBusinessId();
  if (!businessId) throw new Error("Se requiere businessId");
  const { data } = await apiClient.put<OperatorProfile>(
    `/businesses/${businessId}/operator-profiles/${id}`,
    request
  );
  return data;
}

/**
 * Eliminar un perfil de operador
 */
export async function deleteOperatorProfile(id: string): Promise<void> {
  const businessId = getBusinessId();
  if (!businessId) throw new Error("Se requiere businessId");
  await apiClient.delete(`/businesses/${businessId}/operator-profiles/${id}`);
}

/**
 * Clonar un perfil de operador existente
 */
export async function cloneOperatorProfile(
  id: string,
  request: CloneProfileRequest
): Promise<OperatorProfile> {
  const businessId = getBusinessId();
  if (!businessId) throw new Error("Se requiere businessId");
  const { data } = await apiClient.post<OperatorProfile>(
    `/businesses/${businessId}/operator-profiles/${id}/clone`,
    request
  );
  return data;
}

/**
 * Asignar permisos a un perfil de operador
 */
export async function assignPermissions(
  id: string,
  request: AssignPermissionsRequest
): Promise<OperatorProfile> {
  const businessId = getBusinessId();
  if (!businessId) throw new Error("Se requiere businessId");
  const { data } = await apiClient.put<OperatorProfile>(
    `/businesses/${businessId}/operator-profiles/${id}/permissions`,
    request
  );
  return data;
}

/**
 * Obtener el catálogo de permisos disponibles
 */
export async function getPermissionCatalog(): Promise<PermissionCatalog[]> {
  const businessId = getBusinessId();
  if (!businessId) throw new Error("Se requiere businessId");
  const { data } = await apiClient.get<PermissionCatalog[]>(
    `/businesses/${businessId}/operator-profiles/catalog/permissions`
  );
  return data;
}

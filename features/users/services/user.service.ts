/**
 * User Service
 *
 * Servicios para consumir los endpoints de usuarios del backend.
 */

import apiClient from "@/services/api.service";
import { getEffectiveBusinessId } from "@/features/business/stores/business.store";
import type { User, CreateUserRequest, UpdateUserRequest } from "../types";

/**
 * Obtener los usuarios del negocio actual.
 *
 * Por defecto el backend solo devuelve usuarios activos
 * (`GET /businesses/:businessId/users`) — `includeInactive` cambia al
 * endpoint `all/including-inactive` (requiere permiso `user.view_all`,
 * que OWNER/ADMIN/SUPER_ADMIN tienen implícito por bypass de rol) para
 * que los usuarios desactivados sigan siendo visibles y se puedan
 * reactivar desde el listado.
 */
export async function getUsers(includeInactive = false): Promise<User[]> {
  const businessId = getEffectiveBusinessId();
  if (!businessId) throw new Error("Se requiere businessId");
  const path = includeInactive
    ? `/businesses/${businessId}/users/all/including-inactive`
    : `/businesses/${businessId}/users`;
  const { data } = await apiClient.get<User[]>(path);
  return data;
}

/**
 * Obtener un usuario específico por ID
 */
export async function getUserById(id: string): Promise<User> {
  const businessId = getEffectiveBusinessId();
  if (!businessId) throw new Error("Se requiere businessId");
  const { data } = await apiClient.get<User>(`/businesses/${businessId}/users/${id}`);
  return data;
}

/**
 * Crear un nuevo usuario
 */
export async function createUser(request: CreateUserRequest): Promise<User> {
  const businessId = getEffectiveBusinessId();
  if (!businessId) throw new Error("Se requiere businessId");
  const { data } = await apiClient.post<User>(`/businesses/${businessId}/users`, request);
  return data;
}

/**
 * Actualizar un usuario existente.
 *
 * El backend solo expone `PATCH /businesses/:businessId/users/:id` (no hay
 * ruta PUT) — usar `apiClient.put` aquí hacía que toda edición de usuario
 * (incluida la asignación de perfil operativo post-creación en
 * `useCreateUser`) fallara en silencio contra una ruta inexistente.
 */
export async function updateUser(id: string, request: UpdateUserRequest): Promise<User> {
  const businessId = getEffectiveBusinessId();
  if (!businessId) throw new Error("Se requiere businessId");
  const { data } = await apiClient.patch<User>(`/businesses/${businessId}/users/${id}`, request);
  return data;
}

/**
 * Eliminar un usuario
 *
 * En el backend es en realidad un soft-delete (marca active=false, no
 * borra el registro) — ver `activateUser` para revertirlo.
 */
export async function deleteUser(id: string): Promise<void> {
  const businessId = getEffectiveBusinessId();
  if (!businessId) throw new Error("Se requiere businessId");
  await apiClient.delete(`/businesses/${businessId}/users/${id}`);
}

/**
 * Reactivar un usuario previamente eliminado/desactivado
 */
export async function activateUser(id: string): Promise<void> {
  const businessId = getEffectiveBusinessId();
  if (!businessId) throw new Error("Se requiere businessId");
  await apiClient.patch(`/businesses/${businessId}/users/${id}/activate`);
}

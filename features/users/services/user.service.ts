/**
 * User Service
 *
 * Servicios para consumir los endpoints de usuarios del backend.
 */

import apiClient from "@/services/api.service";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import type { User, CreateUserRequest, UpdateUserRequest } from "../types";

/**
 * Obtener el businessId del usuario autenticado
 */
function getBusinessId(): string | null {
  const { user } = useAuthStore.getState();
  return user?.businessId ?? null;
}

/**
 * Obtener todos los usuarios del negocio actual
 */
export async function getUsers(): Promise<User[]> {
  const businessId = getBusinessId();
  if (!businessId) throw new Error("Se requiere businessId");
  const { data } = await apiClient.get<User[]>(`/businesses/${businessId}/users`);
  return data;
}

/**
 * Obtener un usuario específico por ID
 */
export async function getUserById(id: string): Promise<User> {
  const businessId = getBusinessId();
  if (!businessId) throw new Error("Se requiere businessId");
  const { data } = await apiClient.get<User>(`/businesses/${businessId}/users/${id}`);
  return data;
}

/**
 * Crear un nuevo usuario
 */
export async function createUser(request: CreateUserRequest): Promise<User> {
  const businessId = getBusinessId();
  if (!businessId) throw new Error("Se requiere businessId");
  const { data } = await apiClient.post<User>(`/businesses/${businessId}/users`, request);
  return data;
}

/**
 * Actualizar un usuario existente
 */
export async function updateUser(id: string, request: UpdateUserRequest): Promise<User> {
  const businessId = getBusinessId();
  if (!businessId) throw new Error("Se requiere businessId");
  const { data } = await apiClient.put<User>(`/businesses/${businessId}/users/${id}`, request);
  return data;
}

/**
 * Eliminar un usuario
 */
export async function deleteUser(id: string): Promise<void> {
  const businessId = getBusinessId();
  if (!businessId) throw new Error("Se requiere businessId");
  await apiClient.delete(`/businesses/${businessId}/users/${id}`);
}

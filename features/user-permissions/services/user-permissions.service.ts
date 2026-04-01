/**
 * User Permissions Service
 *
 * Servicios para consumir los endpoints de permisos de usuarios del backend.
 * Gestiona la consulta de permisos y asignaciones de usuarios a sucursales.
 */

import apiClient from "@/services/api.service";
import type {
  UserPermissions,
  UserBranchAssignment,
  AssignToBranchRequest,
} from "../types";

/**
 * Obtener los permisos computados de un usuario específico
 *
 * @param userId - ID del usuario
 * @returns Permisos del usuario incluyendo rol y perfil de operador
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions> {
  const { data } = await apiClient.get<UserPermissions>(`/users/${userId}/permissions`);
  return data;
}

/**
 * Obtener todas las asignaciones de sucursales de un usuario
 *
 * @param userId - ID del usuario
 * @returns Lista de asignaciones a sucursales
 */
export async function getUserBranchAssignments(userId: string): Promise<UserBranchAssignment[]> {
  const { data } = await apiClient.get<UserBranchAssignment[]>(`/users/${userId}/branch-assignments`);
  return data;
}

/**
 * Asignar un usuario a una sucursal con un rol específico
 *
 * @param userId - ID del usuario
 * @param request - Datos de la asignación (branchId y role)
 * @returns La asignación creada
 */
export async function assignToBranch(
  userId: string,
  request: AssignToBranchRequest
): Promise<UserBranchAssignment> {
  const { data } = await apiClient.post<UserBranchAssignment>(`/users/${userId}/branch-assignments`, request);
  return data;
}

/**
 * Remover un usuario de una sucursal específica
 *
 * @param userId - ID del usuario
 * @param branchId - ID de la sucursal
 */
export async function removeFromBranch(userId: string, branchId: string): Promise<void> {
  await apiClient.delete(`/users/${userId}/branch-assignments/${branchId}`);
}

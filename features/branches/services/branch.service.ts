/**
 * Branch Service
 *
 * Servicios para consumir los endpoints de sucursales del backend.
 * El businessId se obtiene del JWT del usuario autenticado.
 */

import apiClient from "@/services/api.service";
import type {
  Branch,
  CreateBranchRequest,
  UpdateBranchRequest,
  CanCreateBranchResponse,
} from "../types";

/**
 * Obtener todas las sucursales del negocio actual
 */
export async function getBranches(): Promise<Branch[]> {
  const { data } = await apiClient.get<Branch[]>("/branches");
  return data;
}

/**
 * Obtener una sucursal específica por ID
 */
export async function getBranchById(id: string): Promise<Branch> {
  const { data } = await apiClient.get<Branch>(`/branches/${id}`);
  return data;
}

/**
 * Verificar si se puede crear una nueva sucursal
 */
export async function canCreateBranch(): Promise<CanCreateBranchResponse> {
  const { data } = await apiClient.get<CanCreateBranchResponse>(
    "/branches/can-create"
  );
  return data;
}

/**
 * Crear una nueva sucursal
 */
export async function createBranch(
  request: CreateBranchRequest
): Promise<Branch> {
  const { data } = await apiClient.post<Branch>("/branches", request);
  return data;
}

/**
 * Actualizar una sucursal existente
 */
export async function updateBranch(
  id: string,
  request: UpdateBranchRequest
): Promise<Branch> {
  const { data } = await apiClient.patch<Branch>(`/branches/${id}`, request);
  return data;
}

/**
 * Eliminar una sucursal
 */
export async function deleteBranch(id: string): Promise<void> {
  await apiClient.delete(`/branches/${id}`);
}

/**
 * Establecer una sucursal como principal
 */
export async function setMainBranch(id: string): Promise<Branch> {
  const { data } = await apiClient.post<Branch>(`/branches/${id}/set-main`);
  return data;
}

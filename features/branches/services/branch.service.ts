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
 * Obtener todas las sucursales de un negocio específico
 * Usado por SUPER_ADMIN para cargar sucursales del negocio seleccionado
 * 
 * El businessId se pasa como header x-business-id via apiClient
 */
export async function getBranchesByBusinessId(businessId: string): Promise<Branch[]> {
  // El apiClient agregará el header x-business-id automáticamente
  // cuando detecte que el usuario es SUPER_ADMIN
  const { data } = await apiClient.get<Branch[]>("/branches", {
    headers: {
      "x-business-id": businessId,
    },
  });
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

export interface BranchMetrics {
  branchId: string;
  generadoEn: string;
  ordersToday: number;
  completedToday: number;
  pendingOrders: number;
  totalOrders: number;
  revenueToday: number;
  revenuePeriod: number;
}

/**
 * Obtener métricas de una sucursal
 */
export async function getBranchMetrics(id: string): Promise<BranchMetrics> {
  const { data } = await apiClient.get<BranchMetrics>(`/branches/${id}/metrics`);
  return data;
}

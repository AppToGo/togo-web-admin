/**
 * Table Service
 *
 * Pedidos en mesa (docs/architecture/pedidos-en-mesa.md, Fase 1).
 *
 * Backend endpoints:
 * - GET    /businesses/:businessId/branches/:branchId/tables
 * - GET    /businesses/:businessId/branches/:branchId/tables/:id
 * - POST   /businesses/:businessId/branches/:branchId/tables
 * - PATCH  /businesses/:businessId/branches/:branchId/tables/:id
 * - DELETE /businesses/:businessId/branches/:branchId/tables/:id
 */

import apiClient from "@/services/api.service";
import type {
  RestaurantTable,
  CreateTableRequest,
  UpdateTableRequest,
  RemoveTableResponse,
} from "../types";

function basePath(businessId: string, branchId: string): string {
  return `/businesses/${businessId}/branches/${branchId}/tables`;
}

export async function getTables(
  businessId: string,
  branchId: string
): Promise<RestaurantTable[]> {
  const { data } = await apiClient.get<RestaurantTable[]>(
    basePath(businessId, branchId)
  );
  return data;
}

export async function createTable(
  businessId: string,
  branchId: string,
  dto: CreateTableRequest
): Promise<RestaurantTable> {
  const { data } = await apiClient.post<RestaurantTable>(
    basePath(businessId, branchId),
    dto
  );
  return data;
}

export async function updateTable(
  businessId: string,
  branchId: string,
  id: string,
  dto: UpdateTableRequest
): Promise<RestaurantTable> {
  const { data } = await apiClient.patch<RestaurantTable>(
    `${basePath(businessId, branchId)}/${id}`,
    dto
  );
  return data;
}

export async function removeTable(
  businessId: string,
  branchId: string,
  id: string
): Promise<RemoveTableResponse> {
  const { data } = await apiClient.delete<RemoveTableResponse>(
    `${basePath(businessId, branchId)}/${id}`
  );
  return data;
}

/**
 * Customer Service
 *
 * Servicios para consumir los endpoints de clientes del backend.
 * El businessId se obtiene del store de autenticación (viene del JWT).
 * SUPER_ADMIN puede especificar un businessId para ver clientes de cualquier negocio.
 */

import apiClient from "@/services/api.service";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import type {
  Customer,
  CustomerWithMetrics,
  CustomerMetrics,
  PaginatedCustomersResponse,
  GlobalCustomerMetrics,
  GetCustomersParams,
  UpdateCustomerRequest,
  PaginatedOrdersResponse,
} from "../types";

/**
 * Obtener el businessId del usuario autenticado
 * Para SUPER_ADMIN, retorna null (debe especificar businessId manualmente)
 */
function getBusinessId(): string | null {
  const { user } = useAuthStore.getState();
  if (!user?.businessId && user?.role !== "SUPER_ADMIN") {
    throw new Error("Usuario no tiene un negocio asignado");
  }
  return user?.businessId || null;
}

/**
 * Construir la URL base para clientes
 * SUPER_ADMIN puede especificar un businessId diferente
 */
function getBaseUrl(businessId?: string): string {
  const effectiveBusinessId = businessId || getBusinessId();
  if (!effectiveBusinessId) {
    throw new Error("Se requiere un businessId para consultar clientes");
  }
  return `/businesses/${effectiveBusinessId}/customers`;
}

/**
 * Obtener todos los clientes del negocio actual con paginación
 * SUPER_ADMIN puede pasar businessId para ver clientes de cualquier negocio
 */
export async function getCustomers(
  params?: GetCustomersParams & { businessId?: string }
): Promise<PaginatedCustomersResponse> {
  // Construir query params solo con valores definidos
  const queryParams: Record<string, string> = {};

  if (params?.page !== undefined) {
    queryParams.page = String(params.page);
  }
  if (params?.limit !== undefined) {
    queryParams.limit = String(params.limit);
  }
  if (params?.dateFrom) {
    queryParams.dateFrom = params.dateFrom;
  }
  if (params?.dateTo) {
    queryParams.dateTo = params.dateTo;
  }
  if (params?.sortBy) {
    queryParams.sortBy = params.sortBy;
  }
  if (params?.sortOrder) {
    queryParams.sortOrder = params.sortOrder;
  }
  if (params?.branchId) {
    queryParams.branchId = params.branchId;
  }

  const { data } = await apiClient.get<PaginatedCustomersResponse>(
    getBaseUrl(params?.businessId),
    { params: queryParams }
  );
  return data;
}

/**
 * Obtener un cliente específico por ID
 */
export async function getCustomerById(
  id: string,
  businessId?: string
): Promise<Customer> {
  const { data } = await apiClient.get<Customer>(
    `${getBaseUrl(businessId)}/${id}`
  );
  return data;
}

/**
 * Obtener métricas de un cliente específico
 */
export async function getCustomerMetrics(
  id: string,
  businessId?: string
): Promise<CustomerMetrics> {
  const { data } = await apiClient.get<CustomerMetrics>(
    `${getBaseUrl(businessId)}/${id}/metrics`
  );
  return data;
}

/**
 * Obtener historial de pedidos de un cliente específico con paginación
 */
export async function getCustomerOrders(
  id: string,
  page?: number,
  limit?: number,
  businessId?: string
): Promise<PaginatedOrdersResponse> {
  const queryParams: Record<string, string> = {};

  if (page !== undefined) {
    queryParams.page = String(page);
  }
  if (limit !== undefined) {
    queryParams.limit = String(limit);
  }

  const { data } = await apiClient.get<PaginatedOrdersResponse>(
    `${getBaseUrl(businessId)}/${id}/orders`,
    { params: queryParams }
  );
  return data;
}

/**
 * Obtener métricas globales de clientes del negocio
 * Incluye top 10 por frecuencia y por gasto
 */
export async function getGlobalCustomerMetrics(
  businessId?: string,
  dateFrom?: string,
  dateTo?: string,
  branchId?: string
): Promise<GlobalCustomerMetrics> {
  const effectiveBusinessId = businessId || getBusinessId();
  if (!effectiveBusinessId) {
    throw new Error("Se requiere un businessId para consultar métricas");
  }

  const queryParams: Record<string, string> = {};
  if (dateFrom) queryParams.dateFrom = dateFrom;
  if (dateTo) queryParams.dateTo = dateTo;
  if (branchId) {
    queryParams.branchId = branchId;
  }

  const { data } = await apiClient.get<GlobalCustomerMetrics>(
    `/businesses/${effectiveBusinessId}/customers/metrics`,
    { params: queryParams }
  );
  return data;
}

/**
 * Actualizar un cliente
 */
export async function updateCustomer(
  id: string,
  request: UpdateCustomerRequest,
  businessId?: string
): Promise<Customer> {
  const { data } = await apiClient.patch<Customer>(
    `${getBaseUrl(businessId)}/${id}`,
    request
  );
  return data;
}

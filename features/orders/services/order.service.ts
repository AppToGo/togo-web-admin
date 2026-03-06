/**
 * Order Service
 *
 * Servicios para consumir los endpoints de órdenes del backend.
 * El businessId se obtiene del store de autenticación (viene del JWT).
 * SUPER_ADMIN puede especificar un businessId para ver órdenes de cualquier negocio.
 */

import apiClient from "@/services/api.service";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import type { Business } from "@/types";
import type {
  Order,
  OrderStatusHistory,
  GetOrdersParams,
  UpdateOrderStatusRequest,
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
 * Verificar si el usuario es SUPER_ADMIN
 */
function isSuperAdmin(): boolean {
  const { user } = useAuthStore.getState();
  return user?.role === "SUPER_ADMIN";
}

/**
 * Construir la URL base para órdenes
 * SUPER_ADMIN puede especificar un businessId diferente
 */
function getBaseUrl(businessId?: string): string {
  const effectiveBusinessId = businessId || getBusinessId();
  if (!effectiveBusinessId) {
    throw new Error("Se requiere un businessId para consultar órdenes");
  }
  return `/businesses/${effectiveBusinessId}/orders`;
}

/**
 * Obtener todas las órdenes del negocio actual
 * SUPER_ADMIN puede pasar businessId:
 * - undefined: usa el businessId del usuario (fallback)
 * - "": trae órdenes de TODOS los negocios (endpoint /admin/orders)
 * - "xxx": trae órdenes de un negocio específico
 */
export async function getOrders(
  params?: GetOrdersParams & { businessId?: string }
): Promise<Order[]> {
  // Construir query params solo con valores definidos
  const queryParams: Record<string, string> = {};

  if (params?.status) {
    queryParams.status = params.status;
  }
  if (params?.dateFrom) {
    queryParams.dateFrom = params.dateFrom;
  }
  if (params?.dateTo) {
    queryParams.dateTo = params.dateTo;
  }

  // Si businessId es "" (string vacío), es SUPER_ADMIN pidiendo TODOS
  if (params?.businessId === "") {
    const { data } = await apiClient.get<Order[]>("/admin/orders", {
      params: queryParams,
    });
    return data;
  }

  const { data } = await apiClient.get<Order[]>(getBaseUrl(params?.businessId), {
    params: queryParams,
  });
  return data;
}

/**
 * Obtener todas las órdenes de todos los negocios (solo SUPER_ADMIN)
 */
export async function getAllOrders(
  params?: Omit<GetOrdersParams, "businessId">
): Promise<Order[]> {
  if (!isSuperAdmin()) {
    throw new Error("Solo SUPER_ADMIN puede ver todas las órdenes");
  }

  const queryParams: Record<string, string> = {};

  if (params?.status) {
    queryParams.status = params.status;
  }
  if (params?.dateFrom) {
    queryParams.dateFrom = params.dateFrom;
  }
  if (params?.dateTo) {
    queryParams.dateTo = params.dateTo;
  }

  const { data } = await apiClient.get<Order[]>("/admin/orders", {
    params: queryParams,
  });
  return data;
}

/**
 * Obtener lista de negocios (solo SUPER_ADMIN)
 * Endpoint: GET /v1/businesses
 */
export async function getBusinesses(): Promise<Business[]> {
  const { data } = await apiClient.get<Business[]>("/businesses");
  return data;
}

/**
 * Obtener una orden específica por ID
 */
export async function getOrderById(
  orderId: string,
  businessId?: string
): Promise<Order> {
  const { data } = await apiClient.get<Order>(`${getBaseUrl(businessId)}/${orderId}`);
  return data;
}

/**
 * Obtener órdenes de un cliente específico
 */
export async function getOrdersByCustomer(
  customerId: string,
  businessId?: string
): Promise<Order[]> {
  const { data } = await apiClient.get<Order[]>(
    `${getBaseUrl(businessId)}/customer/${customerId}`
  );
  return data;
}

/**
 * Actualizar el estado de una orden
 */
export async function updateOrderStatus(
  orderId: string,
  request: UpdateOrderStatusRequest,
  businessId?: string
): Promise<Order> {
  const { data } = await apiClient.patch<Order>(
    `${getBaseUrl(businessId)}/${orderId}/status`,
    request
  );
  return data;
}

/**
 * Obtener el historial de cambios de estado de una orden
 */
export async function getOrderStatusHistory(
  orderId: string,
  businessId?: string
): Promise<OrderStatusHistory[]> {
  const { data } = await apiClient.get<OrderStatusHistory[]>(
    `${getBaseUrl(businessId)}/${orderId}/history`
  );
  return data;
}

/**
 * Eliminar una orden (solo para OWNER/ADMIN o estados DRAFT/CANCELLED)
 */
export async function deleteOrder(orderId: string, businessId?: string): Promise<void> {
  await apiClient.delete(`${getBaseUrl(businessId)}/${orderId}`);
}

/**
 * Actualizar el estado de pago de una orden
 */
export interface UpdatePaymentStatusRequest {
  paymentStatus: "PENDING" | "PAID";
  changeNotes?: string;
}

export async function updateOrderPaymentStatus(
  orderId: string,
  request: UpdatePaymentStatusRequest,
  businessId?: string
): Promise<Order> {
  const { data } = await apiClient.patch<Order>(
    `${getBaseUrl(businessId)}/${orderId}/payment-status`,
    request
  );
  return data;
}

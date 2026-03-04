/**
 * Order Service
 *
 * Servicios para consumir los endpoints de órdenes del backend.
 * El businessId se obtiene del store de autenticación (viene del JWT).
 */

import apiClient from "@/services/api.service";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import type {
  Order,
  OrderStatusHistory,
  GetOrdersParams,
  UpdateOrderStatusRequest,
} from "../types";

/**
 * Obtener el businessId del usuario autenticado
 */
function getBusinessId(): string {
  const { user } = useAuthStore.getState();
  if (!user?.businessId) {
    throw new Error("Usuario no tiene un negocio asignado");
  }
  return user.businessId;
}

/**
 * Construir la URL base para órdenes
 */
function getBaseUrl(): string {
  return `/businesses/${getBusinessId()}/orders`;
}

/**
 * Obtener todas las órdenes del negocio actual
 */
export async function getOrders(params?: GetOrdersParams): Promise<Order[]> {
  const { data } = await apiClient.get<Order[]>(getBaseUrl(), {
    params: {
      status: params?.status,
    },
  });
  return data;
}

/**
 * Obtener una orden específica por ID
 */
export async function getOrderById(orderId: string): Promise<Order> {
  const { data } = await apiClient.get<Order>(`${getBaseUrl()}/${orderId}`);
  return data;
}

/**
 * Obtener órdenes de un cliente específico
 */
export async function getOrdersByCustomer(
  customerId: string
): Promise<Order[]> {
  const { data } = await apiClient.get<Order[]>(
    `${getBaseUrl()}/customer/${customerId}`
  );
  return data;
}

/**
 * Actualizar el estado de una orden
 */
export async function updateOrderStatus(
  orderId: string,
  request: UpdateOrderStatusRequest
): Promise<Order> {
  const { data } = await apiClient.patch<Order>(
    `${getBaseUrl()}/${orderId}/status`,
    request
  );
  return data;
}

/**
 * Obtener el historial de cambios de estado de una orden
 */
export async function getOrderStatusHistory(
  orderId: string
): Promise<OrderStatusHistory[]> {
  const { data } = await apiClient.get<OrderStatusHistory[]>(
    `${getBaseUrl()}/${orderId}/history`
  );
  return data;
}

/**
 * Eliminar una orden (solo para OWNER/ADMIN o estados DRAFT/CANCELLED)
 */
export async function deleteOrder(orderId: string): Promise<void> {
  await apiClient.delete(`${getBaseUrl()}/${orderId}`);
}

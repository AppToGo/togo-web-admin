/**
 * Customer Feature Types
 *
 * Tipado estricto para toda la feature de clientes.
 * Basado en los DTOs del backend.
 */

import type { Order } from "@/features/orders/types";

/**
 * Información básica de un cliente
 */
export interface Customer {
  id: string;
  name: string | null;
  phoneNumber: string;
  email: string | null;
  notes: string | null;
  isActive: boolean;
  businessId: string;
  createdAt: Date;
  updatedAt: Date;
  // Relaciones opcionales
  addresses?: CustomerAddress[];
}

/**
 * Dirección de un cliente
 */
export interface CustomerAddress {
  id: string;
  label: string;
  addressText: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  customerId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Producto favorito de un cliente (para métricas)
 */
export interface FavoriteProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalSpent: number;
}

/**
 * Métricas individuales de un cliente
 */
export interface CustomerMetrics {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  firstOrderDate: Date | null;
  lastOrderDate: Date | null;
  favoriteProducts: FavoriteProduct[];
}

/**
 * Cliente con sus métricas incluidas
 */
export interface CustomerWithMetrics extends Customer {
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: Date | null;
}

/**
 * Parámetros para listar clientes
 */
export interface GetCustomersParams {
  page?: number;
  limit?: number;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  sortBy?:
    | "name"
    | "phoneNumber"
    | "totalOrders"
    | "totalSpent"
    | "lastOrderDate"
    | "createdAt";
  sortOrder?: "asc" | "desc";
}

/**
 * Meta información para paginación
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Respuesta paginada de clientes
 */
export interface PaginatedCustomersResponse {
  data: CustomerWithMetrics[];
  meta: PaginationMeta;
}

/**
 * Cliente top por frecuencia (número de pedidos)
 */
export interface TopCustomerByFrequency {
  customerId: string;
  name: string | null;
  phoneNumber: string;
  totalOrders: number;
}

/**
 * Cliente top por gasto (monto total)
 */
export interface TopCustomerBySpending {
  customerId: string;
  name: string | null;
  phoneNumber: string;
  value: number;
}

/**
 * Métricas globales de clientes para un negocio
 */
export interface GlobalCustomerMetrics {
  topByFrequency: TopCustomerByFrequency[];
  topBySpending: TopCustomerBySpending[];
}

/**
 * DTO para actualizar un cliente
 */
export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  notes?: string;
  isActive?: boolean;
}

/**
 * Respuesta paginada de órdenes (reutilizada de orders)
 */
export interface PaginatedOrdersResponse {
  data: Order[];
  meta: PaginationMeta;
}

/**
 * Filtros activos de clientes
 */
export interface CustomerFilters {
  dateFrom?: string;
  dateTo?: string;
  sortBy?: GetCustomersParams["sortBy"];
  sortOrder?: "asc" | "desc";
}

/**
 * Order Feature Types
 *
 * Tipado estricto para toda la feature de órdenes.
 * Basado en los DTOs del backend.
 */

// Enums del backend
export type OrderStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "IN_PROGRESS"
  | "READY"
  | "ON_THE_WAY"
  | "COMPLETED"
  | "CANCELLED"
  | "ABANDONED";

export type PaymentStatus = "PENDING" | "PAID";

export type ConfirmationSource = "CUSTOMER" | "OPERATOR" | "SYSTEM";
export type ConfirmationChannel = "WHATSAPP" | "BACKOFFICE" | "API" | "SYSTEM";

// Información del cliente
export interface CustomerInfo {
  id: string;
  name: string;
  phoneNumber: string;
}

// Información de dirección
export interface AddressInfo {
  id: string;
  label: string;
  addressText: string;
}

// Información del repartidor
export interface DeliveryInfo {
  id: string;
  name: string;
  phoneNumber: string;
}

// Item de la orden
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

// Orden completa
export interface Order {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentProofUrl?: string;
  paymentProofType?: string;
  paymentProofReceivedAt?: Date;
  subtotal: number;
  tax: number;
  total: number;
  /** @deprecated usar total */
  totalAmount: number;
  customerId: string;
  addressId?: string;
  assignedDeliveryId?: string;
  businessId: string;
  source?: "WHATSAPP" | "OPERATOR" | "WEB_CATALOG";
  deliveryType?: "DELIVERY" | "PICKUP" | "DINE_IN";
  deliveryFee?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  customer?: CustomerInfo;
  address?: AddressInfo;
  assignedDelivery?: DeliveryInfo;
  items?: OrderItem[];
}

// Historial de cambios de estado
export interface OrderStatusHistory {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  notes: string | null;
  createdAt: Date;
  changedBy: {
    id: string;
    name: string;
    role: string;
  };
}

// Parámetros para listar órdenes
export interface GetOrdersParams {
  status?: OrderStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  dateFrom?: string;
  dateTo?: string;
}

// Respuesta paginada de órdenes
export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}

// DTO para actualizar estado
export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  assignedDeliveryId?: string;
  userId?: string;
  changeNotes?: string;
  confirmedBy?: ConfirmationSource;
  channel?: ConfirmationChannel;
}

// Configuración de columnas del Kanban
export interface KanbanColumn {
  id: OrderStatus;
  title: string;
  color: string;
  bgColor: string;
  allowedTransitions: OrderStatus[];
}

// Métricas del dashboard de órdenes
export interface OrderMetrics {
  totalOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedToday: number;
  totalRevenue: number;
  averageOrderValue: number;
}

// Actividad reciente
export interface RecentActivity {
  id: string;
  type: "status_change" | "new_order" | "payment_received" | "cancelled";
  orderId: string;
  orderNumber?: string;
  customerName?: string;
  description: string;
  timestamp: Date;
  userName?: string;
}

// Filtros activos
export interface OrderFilters {
  status?: OrderStatus;
  dateFrom?: Date;
  dateTo?: Date;
  customerName?: string;
  minAmount?: number;
  maxAmount?: number;
}

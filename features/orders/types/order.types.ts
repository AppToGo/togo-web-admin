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

export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED" | "FAILED";

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
  productId?: string;
  productVariantId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

// Orden completa
/** Resumen del último análisis del comprobante (lista de pedidos). */
export interface PaymentVerificationSummary {
  analysisStatus:
    | "PENDING"
    | "ANALYZED"
    | "INCONCLUSIVE"
    | "QUOTA_EXCEEDED"
    | "FAILED";
  riskLevel: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  confidenceScore: number | null;
}

/**
 * Custodia del efectivo de un pedido (docs/caja-pedidos.md). Espeja
 * `CashCollectionInfoDto` del backend: solo estado y nombres, sin PII.
 */
export interface CashCollectionInfo {
  status: "PENDING_SETTLEMENT" | "SETTLED" | "VOIDED";
  holderName?: string | null;
  registerName?: string | null;
}

export interface Order {
  id: string;
  /**
   * Número de pedido legible ("154"), sin el símbolo "#" — lo antepone
   * cada lugar que lo muestra. Siempre presente en pedidos confirmados;
   * la API cae al identificador legado (últimos 6 caracteres del id)
   * para pedidos DRAFT/ABANDONED o histórico previo a esta columna. Ver
   * formatOrderNumber() en utils/order-number.utils.ts.
   */
  orderNumber?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentProofUrl?: string;
  paymentProofType?: string;
  paymentProofReceivedAt?: Date;
  /**
   * Último análisis del comprobante, para pintar el ícono del comprobante.
   * Ausente si no hay comprobante o todavía no hay análisis. Solo informa:
   * no aprueba ni rechaza el pago.
   */
  paymentVerification?: PaymentVerificationSummary;
  subtotal: number;
  tax: number;
  /**
   * Propina voluntaria (mesa/mostrador). Ya está dentro de `total`; no
   * cuenta como venta. 0 si no hay.
   */
  tip?: number;
  /** % elegido si la propina fue por porcentaje (null = monto libre). */
  tipPercent?: number | null;
  total: number;
  /** Sede del pedido (viene en `OrderResponseDto`; se usa para caja). */
  branchId?: string;
  /** Custodia del efectivo, solo si el pago fue en efectivo. */
  cashCollection?: CashCollectionInfo;
  /** @deprecated usar total */
  totalAmount: number;
  customerId: string;
  addressId?: string;
  assignedDeliveryId?: string;
  businessId: string;
  /**
   * Canal de origen del pedido. Alineado al enum real del backend
   * `OrderSource` — el valor previo (`"OPERATOR" | "WEB_CATALOG"`) nunca
   * lo produce la API; quién creó el pedido (cliente vs. operador) se
   * expresa en `createdByType`, no acá.
   */
  source?: "WHATSAPP" | "WEB_PUBLIC" | "QR_CODE" | "SOCIAL_MEDIA" | "DIRECT";
  deliveryType?: "DELIVERY" | "PICKUP" | "DINE_IN" | "COUNTER";
  deliveryFee?: number;
  notes?: string;
  /** Pedidos en mesa (docs/architecture/pedidos-en-mesa.md, Fase 1). */
  tableId?: string;
  /** Snapshot del nombre de la mesa al momento del pedido. */
  tableLabel?: string;
  /**
   * Hasta cuándo el cliente tiene el pedido abierto para editarlo desde
   * WhatsApp (ISO). Solo viene si sigue vigente: mientras tanto el backend
   * rechaza mandarlo a producción (409 CUSTOMER_EDITING_ORDER).
   */
  customerEditLockExpiresAt?: string;
  /** Quién originó el pedido — independiente de qué Customer quedó asociado. */
  createdByType?: "CUSTOMER" | "OPERATOR";
  createdByUserId?: string;
  /** Nombre del operador (si createdByType === "OPERATOR"). Solo viene en el detalle, no en listados. */
  createdByUser?: { id: string; name: string };
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
  branchIds?: string[];
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

// ============================================================================
// Nuevo pedido desde el admin (POST /businesses/:businessId/orders)
// ============================================================================

/**
 * Tipo de pedido que puede crear un operador desde el admin.
 * `COUNTER` es venta de mostrador (docs/caja-pedidos.md): se cobra y
 * entrega en el acto, solo si la sede tiene `counterConfig.enabled`.
 */
export type ManualOrderDeliveryType = "DELIVERY" | "PICKUP" | "DINE_IN" | "COUNTER";

/**
 * Métodos de pago del bot de WhatsApp: efectivo y datáfono siempre,
 * transferencia solo si la sede tiene opciones configuradas.
 */
export type ManualOrderPaymentMethod = "CASH" | "TRANSFER" | "DATAPHONE";

export interface CreateOrderItemRequest {
  productVariantId: string;
  quantity: number;
  notes?: string;
}

export interface CreateOrderRequest {
  branchId: string;
  deliveryType: ManualOrderDeliveryType;
  paymentMethod: ManualOrderPaymentMethod;
  items: CreateOrderItemRequest[];
  /** Requerido para domicilio y recoger */
  customerName?: string;
  /** E.164, requerido para domicilio y recoger */
  customerPhone?: string;
  /** Requerido para domicilio */
  addressText?: string;
  /** Requerido para mesa */
  tableId?: string;
  notes?: string;
  /**
   * Cobro en mostrador (solo `deliveryType: COUNTER` + pago en efectivo).
   * `sessionId` es el turno abierto donde entra el efectivo; sin
   * `receivedAmount` se asume pago exacto (las vueltas las calcula el
   * servidor). Espeja `CounterCashDto` del backend.
   */
  cash?: {
    sessionId?: string;
    receivedAmount?: number;
  };
  /**
   * Cobrar al crear un pedido que no es de mostrador (Caja · Vender,
   * docs/caja-pos.md): nace pagado pero sigue su flujo. En efectivo exige
   * `cash.sessionId`. Mostrador siempre cobra al crear y no lo necesita.
   */
  payNow?: boolean;
  /** Propina (solo mesa/mostrador con propina habilitada en la sede). */
  tip?: TipRequest;
}

/**
 * Propina pedida al API: `percent` sobre el subtotal o `amount` libre,
 * nunca ambos. Espeja `TipInputDto` del backend.
 */
export interface TipRequest {
  percent?: number;
  amount?: number;
}

export interface CreateOrderResponse {
  orderId: string;
  orderNumber: string;
  total: number;
  /** Vueltas del cobro en efectivo al crear (calculadas por el servidor). */
  change?: number;
}

// ============================================================================
// Modo operador del catálogo web (mesero tomando pedidos en el local)
// ============================================================================

/** Sesión recién creada: la URL trae el token y solo se entrega acá. */
export interface CreatedOperatorCatalogSession {
  id: string;
  url: string;
  expiresAt: string;
  operatorName: string;
}

export interface CreateOperatorCatalogSessionInput {
  branchId: string;
  /** Operador que toma los pedidos; por defecto, quien abre la sesión */
  userId?: string;
  /** ISO; no puede pasar de `OperatorCatalogSessionWindow.closesAt` */
  expiresAt?: string;
}

/** Hasta cuándo puede durar una sesión abierta ahora en la sede. */
export interface OperatorCatalogSessionWindow {
  /** Apertura del turno; null si la sede no tiene horario */
  opensAt: string | null;
  /** Cierre del turno (puede ser del día siguiente): máximo `expiresAt` */
  closesAt: string;
  timezone: string;
  /** false: sin horario, el máximo es un turno de 12 h */
  scheduleConfigured: boolean;
}

export interface OperatorCatalogSessionOptions {
  /** Usuarios que pueden tomar pedidos en la sede */
  operators: Array<{ id: string; name: string }>;
  /** null: la sede no tiene turno en curso ni próximo */
  window: OperatorCatalogSessionWindow | null;
}

export interface OperatorCatalogSessionSummary {
  id: string;
  userId: string;
  operatorName: string;
  branchId: string;
  branchName: string;
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string | null;
}

/** Auditoría de habilitaciones: solo la ve el dueño del negocio. */
export interface OperatorCatalogSessionAudit {
  id: string;
  branchId: string;
  branchName: string;
  userId: string;
  operatorName: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  /** null: habilitada pero el mesero no ha ingresado */
  firstUsedAt: string | null;
  lastUsedAt: string | null;
}

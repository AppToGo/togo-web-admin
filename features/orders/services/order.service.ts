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
  OrderStatus,
  OrderStatusHistory,
  GetOrdersParams,
  UpdateOrderStatusRequest,
  CreateOrderRequest,
  CreateOrderResponse,
} from "../types";
import type {
  OrderMetricsResponse,
  GetOrderMetricsParams,
} from "../types/order-metrics.types";
import type { OrdersPage } from "../types/order-cache.types";
import { LIVE_STATUSES } from "../constants/order-statuses";
import { stripOrderNumbers } from "../utils/order-number.utils";

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
  const queryParams: Record<string, string | string[]> = {};

  if (params?.status) {
    queryParams.status = params.status;
  }
  if (params?.dateFrom) {
    queryParams.dateFrom = params.dateFrom;
  }
  if (params?.dateTo) {
    queryParams.dateTo = params.dateTo;
  }
  if (params?.branchIds && params.branchIds.length > 0) {
    queryParams.branchIds = params.branchIds;
  }

  // Si businessId es "" (string vacío), es SUPER_ADMIN pidiendo TODOS
  if (params?.businessId === "") {
    const { data } = await apiClient.get<Order[]>("/admin/orders", {
      params: queryParams,
    });
    // orderNumber es secuencial por negocio — ambiguo al mezclar negocios.
    return stripOrderNumbers(data);
  }

  const { data } = await apiClient.get<Order[]>(
    getBaseUrl(params?.businessId),
    {
      params: queryParams,
    }
  );
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
  const { data } = await apiClient.get<Order>(
    `${getBaseUrl(businessId)}/${orderId}`
  );
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
export async function deleteOrder(
  orderId: string,
  businessId?: string
): Promise<void> {
  await apiClient.delete(`${getBaseUrl(businessId)}/${orderId}`);
}

export interface UnseenOrdersFilters {
  branchIds?: string[];
  dateFrom?: string;
  dateTo?: string;
}

/** Usuario del negocio que puede llevar un pedido a domicilio. */
export interface DeliveryCandidate {
  id: string;
  name: string;
}

/**
 * Repartidores posibles al pasar un pedido a "En camino". Endpoint propio de
 * pedidos (permiso de cambiar estado), no el listado de usuarios del admin.
 */
export async function getDeliveryCandidates(businessId: string): Promise<DeliveryCandidate[]> {
  const { data } = await apiClient.get<DeliveryCandidate[]>(
    `${getBaseUrl(businessId)}/delivery-candidates`
  );
  return data;
}

/** Estados del flujo del tablero que el negocio no usa (IN_PROGRESS / READY / ON_THE_WAY). */
export interface BusinessOrderFlow {
  skippedStatuses: OrderStatus[];
}

export async function getOrderFlow(businessId: string): Promise<BusinessOrderFlow> {
  const { data } = await apiClient.get<BusinessOrderFlow>(`${getBaseUrl(businessId)}/flow`);
  return data;
}

/** Solo OWNER/ADMIN: el backend responde 403 a los demás. */
export async function updateOrderFlow(
  businessId: string,
  skippedStatuses: OrderStatus[]
): Promise<BusinessOrderFlow> {
  const { data } = await apiClient.put<BusinessOrderFlow>(`${getBaseUrl(businessId)}/flow`, {
    skippedStatuses,
  });
  return data;
}

/**
 * Pedidos CONFIRMED que nadie del negocio ha abierto (badge de Pedidos del
 * sidebar), con los mismos filtros que el tablero. Sin `branchIds` cuenta
 * todas las sucursales.
 */
export async function getUnseenOrdersCount(
  businessId: string,
  { branchIds, dateFrom, dateTo }: UnseenOrdersFilters = {}
): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>(
    `${getBaseUrl(businessId)}/unseen-count`,
    {
      params: {
        ...(branchIds?.length && { branchIds }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      },
    }
  );
  return data.count;
}

/**
 * Marca el pedido como visto para todo el negocio. Idempotente: el backend
 * solo registra la primera apertura.
 */
export async function markOrderViewed(
  orderId: string,
  businessId: string
): Promise<void> {
  await apiClient.post(`${getBaseUrl(businessId)}/${orderId}/view`);
}

/**
 * Actualizar el estado de pago de una orden
 */
export interface UpdatePaymentStatusRequest {
  paymentStatus: "PENDING" | "PAID";
  changeNotes?: string;
  /**
   * Datos del cobro en efectivo (espeja `CashPaymentDto` del backend).
   * Con `sessionId` el efectivo entra liquidado al turno; sin él queda
   * por liquidar en manos del portador (resuelto en el servidor).
   */
  cash?: {
    sessionId?: string;
    receivedAmount?: number;
  };
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

/**
 * Comprobante de pago de un pedido, ya resuelto a una URL abrible.
 *
 * El backend guarda una key de almacenamiento, no una URL, y la firma en cada
 * lectura (TTL 15 min). Los comprobantes viejos guardaron el media id de
 * WhatsApp, que expira: esos llegan con `url: null` y un `unavailableReason`
 * para poder explicar por qué no hay nada que mostrar.
 */
export type PaymentProofUnavailableReason =
  | "WHATSAPP_MEDIA_NOT_ARCHIVED"
  | "UNRECOGNIZED_REF"
  | "PRESIGN_FAILED";

export interface ResolvedProofMedia {
  kind: "STORAGE_KEY" | "EXTERNAL_URL" | "WHATSAPP_MEDIA_ID" | "UNKNOWN";
  url: string | null;
  mimeType: string | null;
  filename: string | null;
  unavailableReason?: PaymentProofUnavailableReason;
}

export interface PaymentProofItem {
  receivedAt: string | null;
  /** "image" | "document": con qué tipo llegó por WhatsApp. */
  proofType: string | null;
  media: ResolvedProofMedia;
}

export interface PaymentProof {
  orderId: string;
  receivedAt: string | null;
  proofType: string | null;
  /** El más reciente; es también `proofs[0]`. */
  media: ResolvedProofMedia;
  /**
   * Todos los recibidos, del más nuevo al más viejo. El cliente puede mandar
   * varios (una captura más clara, otra cuenta) y el operador los mira todos
   * antes de marcar el pago.
   *
   * Opcional porque el endpoint lo agregó después: una API vieja no lo manda y
   * el visor cae al único de `media`.
   */
  proofs?: PaymentProofItem[];
}

/**
 * Obtener el comprobante de pago de un pedido
 * Endpoint: GET /businesses/:businessId/orders/:id/payment-proof
 *
 * 404 cuando el pedido no tiene comprobante — el llamador lo usa para no
 * mostrar el visor.
 */
export async function getOrderPaymentProof(
  orderId: string,
  businessId?: string
): Promise<PaymentProof> {
  const { data } = await apiClient.get<PaymentProof>(
    `${getBaseUrl(businessId)}/${orderId}/payment-proof`
  );
  return data;
}

export interface VerificationSignal {
  code: string;
  status: "PASS" | "WARNING" | "FAIL" | "SKIPPED";
  description: string;
}

/** Una fila de la tabla "pedido vs comprobante" del visor. */
export interface ProofComparisonRow {
  key: "amount" | "date" | "sender" | "beneficiary" | "currency";
  expected: string | number | null;
  received: string | number | null;
  status: "PASS" | "WARNING" | "FAIL" | "SKIPPED";
  note: string | null;
}

export interface PaymentVerification {
  id: string;
  orderId: string;
  analysisStatus: "PENDING" | "ANALYZED" | "INCONCLUSIVE" | "QUOTA_EXCEEDED" | "FAILED";
  confidenceScore: number | null;
  documentAuthenticityScore: number | null;
  paymentMatchScore: number | null;
  riskLevel: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  signals: VerificationSignal[];
  /** Vacío cuando el análisis no guardó extraídos: el visor esconde la tabla. */
  comparison: ProofComparisonRow[];
  modelVersion: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Último análisis del comprobante de un pedido.
 * Endpoint: GET /businesses/:businessId/orders/:orderId/payment-verification
 *
 * 404 cuando todavía no hay análisis — el llamador no muestra la tarjeta.
 */
export async function getOrderPaymentVerification(
  orderId: string,
  businessId?: string
): Promise<PaymentVerification> {
  const { data } = await apiClient.get<PaymentVerification>(
    `${getBaseUrl(businessId)}/${orderId}/payment-verification`
  );
  return data;
}

/** Resultado del rechazo: si el cliente recibe el aviso por WhatsApp. */
export interface RejectPaymentProofResult {
  customerNotified: boolean;
  /**
   * WINDOW_CLOSED: pasaron más de 24 h desde el último mensaje del cliente
   * y WhatsApp no deja escribirle. NO_PHONE: no hay teléfono.
   */
  reason: "SENT" | "WINDOW_CLOSED" | "NO_PHONE";
}

/**
 * Rechazar el comprobante de pago de un pedido.
 * Endpoint: POST /businesses/:businessId/orders/:id/payment-proof/reject
 *
 * No cambia el estado del pago (sigue PENDING): la conversación vuelve a
 * esperar un comprobante y, si la ventana de 24 h está abierta, el cliente
 * recibe el aviso por WhatsApp con botón a un asesor. Si no, la respuesta
 * lo dice para que el negocio lo contacte por otro medio.
 */
export async function rejectOrderPaymentProof(
  orderId: string,
  businessId?: string
): Promise<RejectPaymentProofResult> {
  const { data } = await apiClient.post<RejectPaymentProofResult>(
    `${getBaseUrl(businessId)}/${orderId}/payment-proof/reject`
  );
  return data;
}

/**
 * Obtener métricas de órdenes del negocio
 * Endpoint: GET /businesses/:businessId/orders/metrics
 */
export async function getOrderMetrics(
  params?: GetOrderMetricsParams
): Promise<OrderMetricsResponse> {
  const effectiveBusinessId = params?.businessId || getBusinessId();
  if (!effectiveBusinessId) {
    throw new Error("Se requiere un businessId para consultar métricas");
  }

  const queryParams: Record<string, string | string[]> = {};
  if (params?.dateFrom) queryParams.dateFrom = params.dateFrom;
  if (params?.dateTo) queryParams.dateTo = params.dateTo;
  if (params?.branchIds && params.branchIds.length > 0) {
    queryParams.branchIds = params.branchIds;
  }

  const { data } = await apiClient.get<OrderMetricsResponse>(
    `/businesses/${effectiveBusinessId}/orders/metrics`,
    { params: queryParams }
  );
  return data;
}

/**
 * Obtener órdenes en vivo (no completadas)
 * Optimizado para cargar todas las órdenes activas de una vez
 *
 * @param params - Filtros incluyendo businessId, statuses (LIVE_STATUSES), date range, branchIds
 * @returns Array de órdenes activas
 */
export async function getLiveOrders(
  params?: GetOrdersParams & { businessId?: string; statuses?: string[] }
): Promise<Order[]> {
  // Construir query params solo con valores definidos
  const queryParams: Record<string, string | string[]> = {};

  // Usar los statuses proporcionados o los LIVE_STATUSES por defecto
  if (params?.statuses && params.statuses.length > 0) {
    queryParams.statuses = params.statuses;
  } else {
    queryParams.statuses = LIVE_STATUSES;
  }

  if (params?.dateFrom) {
    queryParams.dateFrom = params.dateFrom;
  }
  if (params?.dateTo) {
    queryParams.dateTo = params.dateTo;
  }
  if (params?.branchIds && params.branchIds.length > 0) {
    queryParams.branchIds = params.branchIds;
  }

  // Si businessId es "" (string vacío), es SUPER_ADMIN pidiendo TODOS
  if (params?.businessId === "") {
    const { data } = await apiClient.get<Order[]>("/admin/orders", {
      params: queryParams,
    });
    // orderNumber es secuencial por negocio — ambiguo al mezclar negocios.
    return stripOrderNumbers(data);
  }

  const effectiveBusinessId = params?.businessId || getBusinessId();
  if (!effectiveBusinessId) {
    throw new Error("Se requiere un businessId para consultar órdenes");
  }

  const { data } = await apiClient.get<Order[]>(
    `/businesses/${effectiveBusinessId}/orders`,
    {
      params: queryParams,
    }
  );
  return data;
}

/**
 * Obtener órdenes completadas con paginación
 * Optimizado para infinite scroll
 *
 * @param params - Filtros incluyendo businessId, page, limit, date range, branchIds
 * @returns Página paginada de órdenes completadas
 */
export async function getCompletedOrders(
  params?: GetOrdersParams & {
    businessId?: string;
    page?: number;
    limit?: number;
  }
): Promise<OrdersPage> {
  // Construir query params
  const queryParams: Record<string, string | number | string[]> = {};

  // Siempre filtrar por status COMPLETED
  queryParams.status = "COMPLETED";

  if (params?.dateFrom) {
    queryParams.dateFrom = params.dateFrom;
  }
  if (params?.dateTo) {
    queryParams.dateTo = params.dateTo;
  }
  if (params?.branchIds && params.branchIds.length > 0) {
    queryParams.branchIds = params.branchIds;
  }

  // Paginación
  queryParams.page = params?.page || 1;
  queryParams.limit = params?.limit || 20;

  // Si businessId es "" (string vacío), es SUPER_ADMIN pidiendo TODOS
  if (params?.businessId === "") {
    const { data } = await apiClient.get<OrdersPage>("/admin/orders", {
      params: queryParams,
    });
    // orderNumber es secuencial por negocio — ambiguo al mezclar negocios.
    return { ...data, orders: stripOrderNumbers(data.orders) };
  }

  const effectiveBusinessId = params?.businessId || getBusinessId();
  if (!effectiveBusinessId) {
    throw new Error("Se requiere un businessId para consultar órdenes");
  }

  const { data } = await apiClient.get<OrdersPage>(
    `/businesses/${effectiveBusinessId}/orders`,
    {
      params: queryParams,
    }
  );
  return data;
}

/**
 * Crear un pedido desde el admin ("Nuevo pedido" en la pantalla de pedidos).
 * Queda confirmado (columna "Nueva") y atribuido al usuario autenticado.
 * POST /businesses/:businessId/orders
 */
export async function createOrder(
  data: CreateOrderRequest,
  businessId?: string
): Promise<CreateOrderResponse> {
  const { data: created } = await apiClient.post<CreateOrderResponse>(
    getBaseUrl(businessId),
    data
  );
  return created;
}

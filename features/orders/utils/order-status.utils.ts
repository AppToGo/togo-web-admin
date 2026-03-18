/**
 * Order Status Utils
 *
 * Utilidades para manejar estados de órdenes:
 * - Colores y estilos por estado
 * - Transiciones permitidas
 * - Validaciones de negocio
 * 
 * NOTA: Los colores se obtienen automáticamente desde el Theme System.
 * @see features/orders/theme/order-status.theme.ts
 */

import { useTranslations } from "next-intl";
import type { OrderStatus, PaymentStatus } from "../types";
import { 
  STATUS_COLORS as THEME_STATUS_COLORS,
  getStatusLabel as getThemeStatusLabel,
} from "../theme";

// Re-exportar STATUS_COLORS desde el theme (mantiene compatibilidad hacia atrás)
export const STATUS_COLORS = THEME_STATUS_COLORS;

// Etiquetas en español - re-exportadas desde el theme
export const STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: getThemeStatusLabel("DRAFT"),
  CONFIRMED: getThemeStatusLabel("CONFIRMED"),
  PAYMENT_PENDING: getThemeStatusLabel("PAYMENT_PENDING"),
  PAID: getThemeStatusLabel("PAID"),
  IN_PROGRESS: getThemeStatusLabel("IN_PROGRESS"),
  READY: getThemeStatusLabel("READY"),
  ON_THE_WAY: getThemeStatusLabel("ON_THE_WAY"),
  COMPLETED: getThemeStatusLabel("COMPLETED"),
  CANCELLED: getThemeStatusLabel("CANCELLED"),
  ABANDONED: getThemeStatusLabel("ABANDONED"),
};

// Descripciones cortas para tooltips
export const STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  DRAFT: "Orden en proceso de creación",
  CONFIRMED: "Orden confirmada por el cliente",
  PAYMENT_PENDING: "Esperando confirmación de pago",
  PAID: "Pago recibido y confirmado",
  IN_PROGRESS: "Orden en proceso de preparación",
  READY: "Orden lista para entrega/recogida",
  ON_THE_WAY: "En camino a la dirección del cliente",
  COMPLETED: "Orden entregada y completada",
  CANCELLED: "Orden cancelada",
  ABANDONED: "Orden abandonada por inactividad",
};

// Mapa de transiciones permitidas
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ["CONFIRMED", "CANCELLED", "ABANDONED"],
  CONFIRMED: ["PAYMENT_PENDING", "PAID", "IN_PROGRESS", "CANCELLED"],
  PAYMENT_PENDING: ["PAID", "CANCELLED"],
  PAID: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["READY", "CANCELLED"],
  READY: ["ON_THE_WAY", "COMPLETED", "CANCELLED"],
  ON_THE_WAY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  ABANDONED: [],
};

// Estados finales (no se pueden cambiar)
export const FINAL_STATUSES: OrderStatus[] = [
  "COMPLETED",
  "CANCELLED",
  "ABANDONED",
];

// Estados activos (en progreso) - excluyendo READY del Kanban
export const ACTIVE_STATUSES: OrderStatus[] = [
  "CONFIRMED",
  "PAYMENT_PENDING",
  "PAID",
  "IN_PROGRESS",
  "ON_THE_WAY",
];

// Estados que requieren pago antes de completar
export const PAYMENT_REQUIRED_FOR_COMPLETION: OrderStatus[] = [
  "PAYMENT_PENDING",
  "CONFIRMED",
];

/**
 * Verificar si una transición de estado es válida
 */
export function isValidTransition(
  fromStatus: OrderStatus,
  toStatus: OrderStatus
): boolean {
  if (fromStatus === toStatus) return true;
  return ALLOWED_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false;
}

/**
 * Verificar si se puede cambiar el estado de una orden
 */
export function canChangeStatus(order: {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}): boolean {
  return !FINAL_STATUSES.includes(order.status);
}

/**
 * Validar si se puede completar una orden
 * Requiere que el pago esté confirmado
 */
export function canCompleteOrder(order: {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}): { valid: boolean; message?: string } {
  // Si ya está completada, no se puede completar de nuevo
  if (order.status === "COMPLETED") {
    return { valid: false, message: "La orden ya está completada" };
  }

  // Si está cancelada o abandonada, no se puede completar
  if (order.status === "CANCELLED" || order.status === "ABANDONED") {
    return {
      valid: false,
      message: "No se puede completar una orden cancelada o abandonada",
    };
  }

  // Verificar si el pago está pendiente
  if (order.paymentStatus === "PENDING") {
    return {
      valid: false,
      message: "No se puede completar la orden: el pago está pendiente",
    };
  }

  // Verificar si la orden está en un estado que permite completarse
  const canCompleteFrom: OrderStatus[] = ["READY", "ON_THE_WAY"];
  if (!canCompleteFrom.includes(order.status)) {
    return {
      valid: false,
      message: `La orden debe estar "Lista" o "En camino" para completarse (estado actual: ${STATUS_LABELS[order.status]})`,
    };
  }

  return { valid: true };
}

/**
 * Obtener los posibles siguientes estados de una orden
 */
export function getNextStatuses(currentStatus: OrderStatus): OrderStatus[] {
  return ALLOWED_TRANSITIONS[currentStatus] || [];
}

/**
 * Verificar si el estado es final
 */
export function isFinalStatus(status: OrderStatus): boolean {
  return FINAL_STATUSES.includes(status);
}

/**
 * Calcular tiempo transcurrido desde la creación
 */
export function getTimeElapsed(createdAt: Date | string): string {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Hace un momento";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays === 1) return "Ayer";
  return `Hace ${diffDays} días`;
}

/**
 * Formatear fecha para mostrar
 */
export function formatOrderDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formatear monto en pesos colombianos
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Obtener columna del Kanban para un estado
 * Usa la configuración centralizada de KANBAN_COLUMN_CONFIG
 */
export function getKanbanColumns(): { id: OrderStatus; title: string }[] {
  // Importar dinámicamente para evitar dependencias circulares
  const { DEFAULT_KANBAN_STATUSES, getColumnConfig } = require("../config/kanban-columns.config");
  
  return DEFAULT_KANBAN_STATUSES.map((status: OrderStatus) => ({
    id: status,
    title: getColumnConfig(status).title,
  }));
}

/**
 * Obtener color del método de pago
 */
export function getPaymentStatusColor(status: PaymentStatus): {
  bg: string;
  text: string;
} {
  if (status === "PAID") {
    return { bg: "bg-green-100", text: "text-green-700" };
  }
  return { bg: "bg-amber-100", text: "text-amber-700" };
}

/**
 * Etiqueta del estado de pago
 */
export function getPaymentStatusLabel(status: PaymentStatus): string {
  return status === "PAID" ? "Pagado" : "Pendiente";
}

// Labels para métodos de pago
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  CREDIT_CARD: "Tarjeta de crédito",
  DEBIT_CARD: "Tarjeta de débito",
  TRANSFER: "Transferencia",
  NEQUI: "Nequi",
  DAVIPLATA: "Daviplata",
  PSE: "PSE",
  PAYPAL: "PayPal",
  MERCADOPAGO: "MercadoPago",
  OTHER: "Otro",
};

/**
 * Etiqueta del método de pago
 */
export function getPaymentMethodLabel(method: string | undefined): string {
  if (!method) return "No especificado";
  return PAYMENT_METHOD_LABELS[method] || method;
}

// Labels para tipos de entrega
export const DELIVERY_TYPE_LABELS: Record<string, string> = {
  DELIVERY: "Domicilio",
  PICKUP: "Recoger",
  DINE_IN: "A la mesa",
};

/**
 * Etiqueta del tipo de entrega
 */
export function getDeliveryTypeLabel(type: string | undefined): string {
  if (!type) return "No especificado";
  return DELIVERY_TYPE_LABELS[type] || type;
}

/**
 * Hook to get translated status labels
 * Returns a Record of OrderStatus to translated string
 */
export function useStatusLabels(): Record<OrderStatus, string> {
  const t = useTranslations("orders.status");
  
  return {
    DRAFT: t("DRAFT"),
    CONFIRMED: t("CONFIRMED"),
    PAYMENT_PENDING: t("PAYMENT_PENDING"),
    PAID: t("PAID"),
    IN_PROGRESS: t("IN_PROGRESS"),
    READY: t("READY"),
    ON_THE_WAY: t("ON_THE_WAY"),
    COMPLETED: t("COMPLETED"),
    CANCELLED: t("CANCELLED"),
    ABANDONED: t("ABANDONED"),
  };
}

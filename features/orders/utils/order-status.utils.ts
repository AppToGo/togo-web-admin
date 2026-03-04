/**
 * Order Status Utils
 *
 * Utilidades para manejar estados de órdenes:
 * - Colores y estilos por estado
 * - Transiciones permitidas
 * - Validaciones de negocio
 */

import type { OrderStatus, PaymentStatus } from "../types";

// Colores por estado para el UI
export const STATUS_COLORS: Record<
  OrderStatus,
  { bg: string; border: string; text: string; dot: string }
> = {
  DRAFT: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-700",
    dot: "bg-slate-400",
  },
  CONFIRMED: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  PAYMENT_PENDING: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  PAID: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  IN_PROGRESS: {
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    dot: "bg-violet-500",
  },
  READY: {
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    text: "text-cyan-700",
    dot: "bg-cyan-500",
  },
  ON_THE_WAY: {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-700",
    dot: "bg-indigo-500",
  },
  COMPLETED: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  CANCELLED: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  ABANDONED: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-600",
    dot: "bg-gray-400",
  },
};

// Etiquetas en español
export const STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: "Borrador",
  CONFIRMED: "Confirmada",
  PAYMENT_PENDING: "Pago pendiente",
  PAID: "Pagada",
  IN_PROGRESS: "En preparación",
  READY: "Lista",
  ON_THE_WAY: "En camino",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  ABANDONED: "Abandonada",
};

// Descripciones cortas para tooltips
export const STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  DRAFT: "Orden en proceso de creación",
  CONFIRMED: "Orden confirmada por el cliente",
  PAYMENT_PENDING: "Esperando confirmación de pago",
  PAID: "Pago recibido y confirmado",
  IN_PROGRESS: "Preparando los productos",
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

// Estados activos (en progreso)
export const ACTIVE_STATUSES: OrderStatus[] = [
  "CONFIRMED",
  "PAYMENT_PENDING",
  "PAID",
  "IN_PROGRESS",
  "READY",
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
 */
export function getKanbanColumns(): { id: OrderStatus; title: string }[] {
  return [
    { id: "CONFIRMED", title: "Nuevas" },
    { id: "IN_PROGRESS", title: "En Preparación" },
    { id: "READY", title: "Listas" },
    { id: "ON_THE_WAY", title: "En Camino" },
    { id: "COMPLETED", title: "Completadas" },
  ];
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

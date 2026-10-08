import type { OrderStatus } from "../types";

/**
 * Flujo del tablero según las columnas que el usuario tiene visibles.
 *
 * Ocultar una columna (ej. "En proceso" en un negocio que no la usa) la saca
 * del flujo: el pedido pasa directo a la siguiente columna visible, y solo
 * esa es obligatoria. Retroceder es aparte y exige `order.revert_status`.
 * El backend aplica las mismas reglas (api-togo `order-transitions.ts`).
 */

/**
 * Orden de avance. Entregado es siempre el cierre, aunque su columna esté
 * oculta. "En camino" solo aplica a domicilio: recoger y mesa lo saltan.
 */
export const FORWARD_FLOW: readonly OrderStatus[] = [
  "CONFIRMED",
  "IN_PROGRESS",
  "READY",
  "ON_THE_WAY",
  "COMPLETED",
];

/**
 * Estados en curso, en orden: los únicos entre los que se puede retroceder
 * (Entregado y Cancelado son finales). Derivado de FORWARD_FLOW, como en el
 * backend, para no mantener un segundo orden a mano.
 */
const IN_FLIGHT_FLOW: readonly OrderStatus[] = FORWARD_FLOW.filter(
  (status) => status !== "COMPLETED"
);

/** Posición en el flujo de los estados sin columna propia. */
const FLOW_POSITION: Partial<Record<OrderStatus, OrderStatus>> = {
  PAYMENT_PENDING: "CONFIRMED",
  PAID: "CONFIRMED",
};

/**
 * "En camino" solo existe para domicilio (misma regla que el backend). Un
 * pedido sin tipo de entrega cuenta como domicilio: son pedidos viejos que
 * ya podían pasar a En camino.
 */
export function isStatusApplicable(
  status: OrderStatus,
  deliveryType: string | null | undefined
): boolean {
  return status !== "ON_THE_WAY" || deliveryType == null || deliveryType === "DELIVERY";
}

/** Estados visibles en el tablero; `null` = todos (fuera del tablero). */
export type VisibleStatuses = ReadonlySet<OrderStatus> | null;

const isVisible = (status: OrderStatus, visible: VisibleStatuses) =>
  visible === null || visible.has(status);

/**
 * Siguiente estado obligatorio: la primera columna visible después de la
 * actual. Si no queda ninguna visible, Entregado (siempre se puede cerrar).
 * `null` si el pedido ya no avanza (Entregado, Cancelado, Borrador…).
 */
export function getNextVisibleStatus(
  status: OrderStatus,
  visible: VisibleStatuses,
  deliveryType?: string | null
): OrderStatus | null {
  const position = FLOW_POSITION[status] ?? status;
  const index = FORWARD_FLOW.indexOf(position);
  if (index === -1 || position === "COMPLETED") return null;
  for (const candidate of FORWARD_FLOW.slice(index + 1)) {
    if (candidate === "COMPLETED") return candidate;
    if (isVisible(candidate, visible) && isStatusApplicable(candidate, deliveryType)) {
      return candidate;
    }
  }
  return null;
}

/** Devolver un pedido en curso a un estado anterior (copia de la regla del backend). */
export function isRevertTransition(from: OrderStatus, to: OrderStatus): boolean {
  const fromIndex = IN_FLIGHT_FLOW.indexOf(from);
  const toIndex = IN_FLIGHT_FLOW.indexOf(to);
  return fromIndex !== -1 && toIndex !== -1 && toIndex < fromIndex;
}

export type StatusMoveCheck =
  | { ok: true }
  | { ok: false; reason: "mustPassThrough"; next: OrderStatus }
  | { ok: false; reason: "noRevertPermission" | "notAllowed" | "onlyDelivery" };

const FINAL: readonly OrderStatus[] = ["COMPLETED", "CANCELLED", "ABANDONED"];

/**
 * ¿Se puede mover el pedido de `from` a `to` desde el tablero?
 * - Avanzar: solo a la siguiente columna visible (las ocultas se saltan).
 * - Cancelar: desde cualquier estado no final.
 * - Retroceder: solo entre estados en curso y con el permiso.
 */
export function checkStatusMove(
  from: OrderStatus,
  to: OrderStatus,
  {
    visible,
    canRevert,
    deliveryType,
  }: { visible: VisibleStatuses; canRevert: boolean; deliveryType?: string | null }
): StatusMoveCheck {
  if (from === to || FINAL.includes(from)) return { ok: false, reason: "notAllowed" };
  if (to === "CANCELLED") return { ok: true };
  if (!isStatusApplicable(to, deliveryType)) return { ok: false, reason: "onlyDelivery" };
  if (isRevertTransition(from, to)) {
    // Tampoco se retrocede a un estado que el negocio no usa.
    if (!isVisible(to, visible)) return { ok: false, reason: "notAllowed" };
    return canRevert ? { ok: true } : { ok: false, reason: "noRevertPermission" };
  }
  const next = getNextVisibleStatus(from, visible, deliveryType);
  if (next === null) return { ok: false, reason: "notAllowed" };
  if (to === next) return { ok: true };
  const isFurtherAhead =
    FORWARD_FLOW.indexOf(to) > FORWARD_FLOW.indexOf(next) && FORWARD_FLOW.includes(to);
  return isFurtherAhead
    ? { ok: false, reason: "mustPassThrough", next }
    : { ok: false, reason: "notAllowed" };
}

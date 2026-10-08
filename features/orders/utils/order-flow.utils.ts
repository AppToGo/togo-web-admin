import type { OrderStatus } from "../types";

/**
 * Flujo del tablero según las columnas que el usuario tiene visibles.
 *
 * Ocultar una columna (ej. "En proceso" en un negocio que no la usa) la saca
 * del flujo: el pedido pasa directo a la siguiente columna visible, y solo
 * esa es obligatoria. Retroceder es aparte y exige `order.revert_status`.
 * El backend aplica las mismas reglas (api-togo `order-transitions.ts`).
 */

/** Orden de avance. Entregado es siempre el cierre, aunque su columna esté oculta. */
export const FORWARD_FLOW: readonly OrderStatus[] = [
  "CONFIRMED",
  "IN_PROGRESS",
  "READY",
  "COMPLETED",
];

/** Estados en curso entre los que se puede retroceder (Entregado y Cancelado son finales). */
const REVERTIBLE_FLOW: readonly OrderStatus[] = ["CONFIRMED", "IN_PROGRESS", "READY"];

/** Posición en el flujo de los estados sin columna propia. */
const FLOW_POSITION: Partial<Record<OrderStatus, OrderStatus>> = {
  PAYMENT_PENDING: "CONFIRMED",
  PAID: "CONFIRMED",
  ON_THE_WAY: "READY",
};

const REVERT_FROM_RANK: Partial<Record<OrderStatus, number>> = {
  IN_PROGRESS: 1,
  READY: 2,
  ON_THE_WAY: 3,
};

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
  visible: VisibleStatuses
): OrderStatus | null {
  const position = FLOW_POSITION[status] ?? status;
  const index = FORWARD_FLOW.indexOf(position);
  if (index === -1 || position === "COMPLETED") return null;
  for (const candidate of FORWARD_FLOW.slice(index + 1)) {
    if (candidate === "COMPLETED" || isVisible(candidate, visible)) return candidate;
  }
  return null;
}

/** Devolver un pedido en curso a un estado anterior (copia de la regla del backend). */
export function isRevertTransition(from: OrderStatus, to: OrderStatus): boolean {
  const fromRank = REVERT_FROM_RANK[from];
  const toRank = REVERTIBLE_FLOW.indexOf(to);
  return fromRank !== undefined && toRank !== -1 && toRank < fromRank;
}

export type StatusMoveCheck =
  | { ok: true }
  | { ok: false; reason: "mustPassThrough"; next: OrderStatus }
  | { ok: false; reason: "noRevertPermission" | "notAllowed" };

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
  { visible, canRevert }: { visible: VisibleStatuses; canRevert: boolean }
): StatusMoveCheck {
  if (from === to || FINAL.includes(from)) return { ok: false, reason: "notAllowed" };
  if (to === "CANCELLED") return { ok: true };
  if (isRevertTransition(from, to)) {
    return canRevert ? { ok: true } : { ok: false, reason: "noRevertPermission" };
  }
  const next = getNextVisibleStatus(from, visible);
  if (next === null) return { ok: false, reason: "notAllowed" };
  if (to === next) return { ok: true };
  const isFurtherAhead =
    FORWARD_FLOW.indexOf(to) > FORWARD_FLOW.indexOf(next) && FORWARD_FLOW.includes(to);
  return isFurtherAhead
    ? { ok: false, reason: "mustPassThrough", next }
    : { ok: false, reason: "notAllowed" };
}

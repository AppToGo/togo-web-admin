import type { Order } from "../types";

/**
 * Order Number Utilities
 *
 * Shared utility functions for formatting order numbers consistently
 * across the application. Única implementación — antes había tres
 * versiones independientes (este util, y una copia local en cada uno de
 * OrdersKanbanBoard.tsx y OrderDetailContent.tsx) que además eran
 * inconsistentes entre sí: dos tomaban los primeros 6 caracteres del id
 * y una los últimos, así que el mismo pedido podía mostrar códigos
 * distintos en el Kanban y en el detalle.
 */

const MISSING_ID_PLACEHOLDER = "------";

/**
 * El valor "pelado" del número de pedido, SIN "#".
 *
 * Prefiere `orderNumber` (el número real y secuencial que asigna la API
 * al confirmar el pedido) cuando está presente. Si no — pedido todavía
 * en DRAFT, o histórico de antes de que existiera esa columna — cae al
 * identificador legado: los ÚLTIMOS 6 caracteres del id, en mayúsculas.
 * Ese fallback tiene que coincidir exactamente con
 * OrderNumberService.format() del backend (api-togo,
 * src/business-actions/services/order-number.service.ts) — es el mismo
 * valor que ya recibió el cliente por WhatsApp para ese pedido.
 *
 * `id` vacío/undefined (pedido parcial o todavía sin cargar) devuelve el
 * placeholder — mismo comportamiento que tenía la versión local de
 * OrderDetailContent.tsx antes de unificarse acá.
 *
 * Usar esta función (no `formatOrderNumber`) en cualquier lugar donde el
 * "#" ya lo pone otra cosa — un template de i18n como "Orden #{id}", por
 * ejemplo — para no terminar con "##154".
 */
export function orderNumberValue(
  id: string | undefined,
  orderNumber?: string | number | null
): string {
  if (!id) return MISSING_ID_PLACEHOLDER;
  if (orderNumber != null && orderNumber !== "") {
    return String(orderNumber);
  }
  return id.slice(-6).toUpperCase();
}

/**
 * El número de pedido listo para mostrar, CON "#" incluido.
 * @returns ej. "#154", "#A1B2C3", o "#------" si falta el id.
 */
export function formatOrderNumber(
  id: string | undefined,
  orderNumber?: string | number | null
): string {
  return `#${orderNumberValue(id, orderNumber)}`;
}

/**
 * `orderNumber` es secuencial POR NEGOCIO (business_order_counters en el
 * backend arranca en 1 para cada negocio) — dos negocios distintos van a
 * tener, ambos, un pedido "#1". Es correcto y sin ambigüedad en cualquier
 * vista scopeada a un solo negocio, pero `/admin/orders` (SUPER_ADMIN,
 * "Todos los negocios") por definición mezcla pedidos de negocios
 * distintos, así que mostrar `orderNumber` tal cual haría que dos
 * pedidos de negocios distintos parezcan el mismo pedido.
 *
 * Este helper saca `orderNumber` de la respuesta de ESE endpoint —
 * incondicional, no depende de si la página en particular tiene uno o
 * varios negocios (con paginación eso puede cambiar de página en
 * página) — forzando a `formatOrderNumber`/`orderNumberValue` a caer al
 * identificador legado, que sí es efectivamente único entre negocios
 * (deriva del id, un cuid global).
 *
 * Llamar en el punto donde se obtienen los pedidos (los tres call sites
 * de `/admin/orders` en order.service.ts), no en cada componente — así
 * ningún renderer nuevo puede olvidarse de este caso.
 */
export function stripOrderNumbers<
  T extends Pick<Order, "orderNumber">
>(orders: T[]): T[] {
  return orders.map((o) => ({ ...o, orderNumber: undefined }));
}

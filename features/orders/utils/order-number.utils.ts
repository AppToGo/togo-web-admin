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
 * Usar esta función (no `formatOrderNumber`) en cualquier lugar donde el
 * "#" ya lo pone otra cosa — un template de i18n como "Orden #{id}", por
 * ejemplo — para no terminar con "##154".
 */
export function orderNumberValue(
  id: string,
  orderNumber?: string | number | null
): string {
  if (orderNumber != null && orderNumber !== "") {
    return String(orderNumber);
  }
  return id.slice(-6).toUpperCase();
}

/**
 * El número de pedido listo para mostrar, CON "#" incluido.
 * @returns ej. "#154" o "#A1B2C3"
 */
export function formatOrderNumber(
  id: string,
  orderNumber?: string | number | null
): string {
  return `#${orderNumberValue(id, orderNumber)}`;
}

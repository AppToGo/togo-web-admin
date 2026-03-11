/**
 * Utils Generator
 * 
 * Genera utilidades y mappings automáticamente desde el STATUS_THEME.
 * Estas funciones reemplazan las definiciones manuales de colores.
 */

import type { OrderStatus } from "../../types";
import { STATUS_THEME, getStatusTokens, type ColorName } from "../order-status.theme";

/** Set completo de colores para un estado */
export type StatusColorSet = {
  bg: string;
  border: string;
  text: string;
  dot: string;
};

/**
 * Genera el mapping de colores para todos los estados
 * Reemplaza STATUS_COLORS manual en order-status.utils.ts
 */
export function generateStatusColors(): Record<OrderStatus, StatusColorSet> {
  const statuses = Object.keys(STATUS_THEME) as OrderStatus[];
  return statuses.reduce((acc, status) => {
    const tokens = getStatusTokens(status);
    acc[status] = {
      bg: tokens.bg,
      border: tokens.border,
      text: tokens.text,
      dot: tokens.dot,
    };
    return acc;
  }, {} as Record<OrderStatus, StatusColorSet>);
}

/** STATUS_COLORS generado automáticamente desde el theme */
export const STATUS_COLORS = generateStatusColors();

/**
 * Obtiene el nombre del color para un estado
 * Alias para mantener compatibilidad
 */
export function getStatusColorName(status: OrderStatus): ColorName {
  return STATUS_THEME[status].color;
}

/**
 * Genera un mapping de colores de dot para un conjunto de estados
 * Útil para componentes como ColumnVisibilityBar
 */
export function generateColumnColors(statuses: OrderStatus[]): Record<string, string> {
  return statuses.reduce((acc, status) => {
    acc[status] = getStatusTokens(status).dot;
    return acc;
  }, {} as Record<string, string>);
}

/**
 * Genera un mapping de labels para un conjunto de estados
 */
export function generateColumnLabels(statuses: OrderStatus[]): Record<string, string> {
  return statuses.reduce((acc, status) => {
    acc[status] = STATUS_THEME[status].label;
  return acc;
  }, {} as Record<string, string>);
}

/**
 * Genera configuración de columna Kanban desde el theme
 * Compatible con KanbanColumn del tipo order.types.ts
 */
export function generateKanbanColumnConfig() {
  const statuses = Object.keys(STATUS_THEME) as OrderStatus[];
  
  return statuses.map((status) => {
    const config = STATUS_THEME[status];
    const tokens = getStatusTokens(status);
    
    return {
      id: status,
      title: config.label,
      color: tokens.dot,
      bgColor: tokens.bg,
    };
  });
}

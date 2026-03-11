/**
 * Kanban Columns Configuration
 *
 * Configuración centralizada de columnas Kanban.
 * Los colores y estilos se obtienen automáticamente desde el Theme System.
 * 
 * @see features/orders/theme/order-status.theme.ts - Fuente única de verdad para colores
 */

import type { OrderStatus } from "../types";
import { STATUS_THEME, getStatusLabel, getStatusDescription } from "../theme";

/** Variante de columna para compatibilidad con código existente */
export type ColumnVariant = "gray" | "blue" | "purple" | "orange" | "emerald" | "pink";

/** Configuración de una columna */
export interface ColumnConfig {
  title: string;
  variant: ColumnVariant;
  description?: string;
}

/**
 * Mapeo de nombres de color del theme a variantes de columna
 * Para mantener compatibilidad con código existente
 */
const COLOR_TO_VARIANT: Record<string, ColumnVariant> = {
  gray: "gray",
  blue: "blue",
  indigo: "blue",
  teal: "emerald",
  purple: "purple",
  amber: "orange",
  cyan: "blue",
  emerald: "emerald",
  pink: "pink",
  slate: "gray",
};

/**
 * Configuración de columnas Kanban por estado de orden
 * Generada automáticamente desde STATUS_THEME
 */
export const KANBAN_COLUMN_CONFIG: Record<OrderStatus, ColumnConfig> = {
  DRAFT: {
    title: getStatusLabel("DRAFT"),
    variant: COLOR_TO_VARIANT[STATUS_THEME.DRAFT.color],
    description: getStatusDescription("DRAFT"),
  },
  CONFIRMED: {
    title: getStatusLabel("CONFIRMED"),
    variant: COLOR_TO_VARIANT[STATUS_THEME.CONFIRMED.color],
    description: getStatusDescription("CONFIRMED"),
  },
  PAYMENT_PENDING: {
    title: getStatusLabel("PAYMENT_PENDING"),
    variant: COLOR_TO_VARIANT[STATUS_THEME.PAYMENT_PENDING.color],
    description: getStatusDescription("PAYMENT_PENDING"),
  },
  PAID: {
    title: getStatusLabel("PAID"),
    variant: COLOR_TO_VARIANT[STATUS_THEME.PAID.color],
    description: getStatusDescription("PAID"),
  },
  IN_PROGRESS: {
    title: getStatusLabel("IN_PROGRESS"),
    variant: COLOR_TO_VARIANT[STATUS_THEME.IN_PROGRESS.color],
    description: getStatusDescription("IN_PROGRESS"),
  },
  READY: {
    title: getStatusLabel("READY"),
    variant: COLOR_TO_VARIANT[STATUS_THEME.READY.color],
    description: getStatusDescription("READY"),
  },
  ON_THE_WAY: {
    title: getStatusLabel("ON_THE_WAY"),
    variant: COLOR_TO_VARIANT[STATUS_THEME.ON_THE_WAY.color],
    description: getStatusDescription("ON_THE_WAY"),
  },
  COMPLETED: {
    title: getStatusLabel("COMPLETED"),
    variant: COLOR_TO_VARIANT[STATUS_THEME.COMPLETED.color],
    description: getStatusDescription("COMPLETED"),
  },
  CANCELLED: {
    title: getStatusLabel("CANCELLED"),
    variant: COLOR_TO_VARIANT[STATUS_THEME.CANCELLED.color],
    description: getStatusDescription("CANCELLED"),
  },
  ABANDONED: {
    title: getStatusLabel("ABANDONED"),
    variant: COLOR_TO_VARIANT[STATUS_THEME.ABANDONED.color],
    description: getStatusDescription("ABANDONED"),
  },
};

/**
 * Estados que se muestran por defecto en el Kanban
 */
export const DEFAULT_KANBAN_STATUSES: OrderStatus[] = [
  "CONFIRMED",
  "IN_PROGRESS",
  "ON_THE_WAY",
  "COMPLETED",
];

/**
 * Obtiene la configuración de una columna por su status
 */
export function getColumnConfig(status: OrderStatus): ColumnConfig {
  return KANBAN_COLUMN_CONFIG[status];
}

/**
 * Obtiene el título de una columna por su status
 * Alias para compatibilidad, usa getStatusLabel del theme
 */
export function getColumnTitle(status: OrderStatus): string {
  return getStatusLabel(status);
}

/**
 * Obtiene la variante de color de una columna por su status
 */
export function getColumnVariant(status: OrderStatus): ColumnVariant {
  return KANBAN_COLUMN_CONFIG[status].variant;
}

/**
 * Kanban Columns Configuration
 *
 * Configuración centralizada de columnas Kanban.
 * Los colores y estilos se obtienen automáticamente desde el Theme System.
 *
 * @see features/orders/theme/order-status.theme.ts - Fuente única de verdad para colores
 */

import type { OrderStatus } from "../types";
import { STATUS_THEME } from "../theme";

/** Variante de columna para compatibilidad con código existente */
export type ColumnVariant =
  | "gray"
  | "blue"
  | "purple"
  | "orange"
  | "emerald"
  | "pink";

/** Configuración de una columna */
export interface ColumnConfig {
  title: string;
  variant: ColumnVariant;
  description?: string;
}

/**
 * Mapeo de nombres de color del theme a variantes de columna legacy
 *
 * NOTA: Este mapeo es INTENCIONAL para mantener compatibilidad con código existente.
 * El theme system usa una paleta más amplia de colores (indigo, teal, cyan, amber)
 * pero las variantes de ColumnVariant son limitadas para compatibilidad backward.
 *
 * Mapeos:
 * - indigo → blue (ambos son azules)
 * - teal → emerald (ambos son verdes azulados)
 * - cyan → blue (cian es un azul claro)
 * - amber → orange (ámbar es un naranja dorado)
 * - slate → gray (pizarra es un gris azulado)
 */
const COLOR_TO_VARIANT: Record<string, ColumnVariant> = {
  gray: "gray",
  blue: "blue",
  indigo: "blue", // Mapeado a blue para compatibilidad
  teal: "emerald", // Mapeado a emerald para compatibilidad
  purple: "purple",
  amber: "orange", // Mapeado a orange para compatibilidad
  cyan: "blue", // Mapeado a blue para compatibilidad
  emerald: "emerald",
  pink: "pink",
  slate: "gray", // Mapeado a gray para compatibilidad
};

/**
 * Configuración de columnas Kanban por estado de orden
 * Generada automáticamente desde STATUS_THEME
 *
 * NOTE: Titles are now status keys. Use useTranslations('orders.status') in components
 * to get the translated labels: t(statusKey)
 */
export const KANBAN_COLUMN_CONFIG: Record<OrderStatus, ColumnConfig> = {
  DRAFT: {
    title: "DRAFT",
    variant: COLOR_TO_VARIANT[STATUS_THEME.DRAFT.color],
    description: "DRAFT",
  },
  CONFIRMED: {
    title: "CONFIRMED",
    variant: COLOR_TO_VARIANT[STATUS_THEME.CONFIRMED.color],
    description: "CONFIRMED",
  },
  PAYMENT_PENDING: {
    title: "PAYMENT_PENDING",
    variant: COLOR_TO_VARIANT[STATUS_THEME.PAYMENT_PENDING.color],
    description: "PAYMENT_PENDING",
  },
  PAID: {
    title: "PAID",
    variant: COLOR_TO_VARIANT[STATUS_THEME.PAID.color],
    description: "PAID",
  },
  IN_PROGRESS: {
    title: "IN_PROGRESS",
    variant: COLOR_TO_VARIANT[STATUS_THEME.IN_PROGRESS.color],
    description: "IN_PROGRESS",
  },
  READY: {
    title: "READY",
    variant: COLOR_TO_VARIANT[STATUS_THEME.READY.color],
    description: "READY",
  },
  ON_THE_WAY: {
    title: "ON_THE_WAY",
    variant: COLOR_TO_VARIANT[STATUS_THEME.ON_THE_WAY.color],
    description: "ON_THE_WAY",
  },
  COMPLETED: {
    title: "COMPLETED",
    variant: COLOR_TO_VARIANT[STATUS_THEME.COMPLETED.color],
    description: "COMPLETED",
  },
  CANCELLED: {
    title: "CANCELLED",
    variant: COLOR_TO_VARIANT[STATUS_THEME.CANCELLED.color],
    description: "CANCELLED",
  },
  ABANDONED: {
    title: "ABANDONED",
    variant: COLOR_TO_VARIANT[STATUS_THEME.ABANDONED.color],
    description: "ABANDONED",
  },
};

/**
 * Estados que se muestran por defecto en el Kanban
 * CANCELLED is included but hidden by default via ColumnVisibilityBar
 */
export const DEFAULT_KANBAN_STATUSES: OrderStatus[] = [
  "CONFIRMED",
  "IN_PROGRESS",
  "READY",
  "COMPLETED",
  "CANCELLED",
];

/**
 * Obtiene la configuración de una columna por su status
 */
export function getColumnConfig(status: OrderStatus): ColumnConfig {
  return KANBAN_COLUMN_CONFIG[status];
}

/**
 * Obtiene el título de una columna por su status
 * Returns the status key - use useTranslations('orders.status') in components
 * @deprecated Use useTranslations('orders.status') with the status key instead
 */
export function getColumnTitle(status: OrderStatus): string {
  return status;
}

/**
 * Obtiene la variante de color de una columna por su status
 */
export function getColumnVariant(status: OrderStatus): ColumnVariant {
  return KANBAN_COLUMN_CONFIG[status].variant;
}

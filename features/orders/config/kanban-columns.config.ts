/**
 * Kanban Columns Configuration
 *
 * Configuración centralizada de estilos por status de orden.
 * Define los estilos como parte del dominio, no de la UI.
 */

import type { OrderStatus } from "../types";

export type ColumnVariant = "gray" | "blue" | "purple" | "orange" | "emerald" | "pink";

export interface ColumnConfig {
  title: string;
  variant: ColumnVariant;
  description?: string;
}

/**
 * Configuración de columnas Kanban por estado de orden
 */
export const KANBAN_COLUMN_CONFIG: Record<OrderStatus, ColumnConfig> = {
  DRAFT: {
    title: "Borrador",
    variant: "gray",
    description: "Órdenes en borrador",
  },
  CONFIRMED: {
    title: "Confirmada",
    variant: "blue",
    description: "Órdenes confirmadas",
  },
  PAYMENT_PENDING: {
    title: "Pago pendiente",
    variant: "blue",
    description: "Órdenes esperando pago",
  },
  PAID: {
    title: "Pagada",
    variant: "purple",
    description: "Órdenes pagadas",
  },
  IN_PROGRESS: {
    title: "En proceso",
    variant: "purple",
    description: "Órdenes en preparación",
  },
  READY: {
    title: "Lista",
    variant: "orange",
    description: "Órdenes listas para entrega",
  },
  ON_THE_WAY: {
    title: "En camino",
    variant: "orange",
    description: "Órdenes en entrega",
  },
  COMPLETED: {
    title: "Completada",
    variant: "emerald",
    description: "Órdenes completadas",
  },
  CANCELLED: {
    title: "Cancelada",
    variant: "pink",
    description: "Órdenes canceladas",
  },
  ABANDONED: {
    title: "Abandonada",
    variant: "gray",
    description: "Órdenes abandonadas",
  },
};

/**
 * Estados que se muestran por defecto en el Kanban
 */
export const DEFAULT_KANBAN_STATUSES: OrderStatus[] = [
  "CONFIRMED",
  "IN_PROGRESS",
  "READY",
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
 */
export function getColumnTitle(status: OrderStatus): string {
  return KANBAN_COLUMN_CONFIG[status].title;
}

/**
 * Obtiene la variante de color de una columna por su status
 */
export function getColumnVariant(status: OrderStatus): ColumnVariant {
  return KANBAN_COLUMN_CONFIG[status].variant;
}

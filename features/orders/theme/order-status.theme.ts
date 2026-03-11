/**
 * Order Status Theme - ÚNICA FUENTE DE VERDAD
 * 
 * Este archivo contiene la única fuente de verdad para todos los colores
 * y estilos relacionados con los estados de órdenes (OrderStatus).
 * 
 * IMPORTANTE: No definir colores manualmente en otros archivos.
 * Usar siempre las funciones y constantes exportadas desde aquí.
 */

import type { OrderStatus } from "../types";

/** Nombres de colores disponibles en la paleta */
export type ColorName = 
  | "gray" | "blue" | "indigo" | "teal" | "purple" 
  | "amber" | "cyan" | "emerald" | "pink" | "slate";

/** Escala de colores Tailwind (50-700) */
export type ColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
};

/** Paleta de colores completa - mapea a clases de Tailwind */
export const COLOR_PALETTE: Record<ColorName, ColorScale> = {
  gray:    { 50: "gray-50", 100: "gray-100", 200: "gray-200", 300: "gray-300", 400: "gray-400", 500: "gray-500", 600: "gray-600", 700: "gray-700" },
  blue:    { 50: "blue-50", 100: "blue-100", 200: "blue-200", 300: "blue-300", 400: "blue-400", 500: "blue-500", 600: "blue-600", 700: "blue-700" },
  indigo:  { 50: "indigo-50", 100: "indigo-100", 200: "indigo-200", 300: "indigo-300", 400: "indigo-400", 500: "indigo-500", 600: "indigo-600", 700: "indigo-700" },
  teal:    { 50: "teal-50", 100: "teal-100", 200: "teal-200", 300: "teal-300", 400: "teal-400", 500: "teal-500", 600: "teal-600", 700: "teal-700" },
  purple:  { 50: "purple-50", 100: "purple-100", 200: "purple-200", 300: "purple-300", 400: "purple-400", 500: "purple-500", 600: "purple-600", 700: "purple-700" },
  amber:   { 50: "amber-50", 100: "amber-100", 200: "amber-200", 300: "amber-300", 400: "amber-400", 500: "amber-500", 600: "amber-600", 700: "amber-700" },
  cyan:    { 50: "cyan-50", 100: "cyan-100", 200: "cyan-200", 300: "cyan-300", 400: "cyan-400", 500: "cyan-500", 600: "cyan-600", 700: "cyan-700" },
  emerald: { 50: "emerald-50", 100: "emerald-100", 200: "emerald-200", 300: "emerald-300", 400: "emerald-400", 500: "emerald-500", 600: "emerald-600", 700: "emerald-700" },
  pink:    { 50: "pink-50", 100: "pink-100", 200: "pink-200", 300: "pink-300", 400: "pink-400", 500: "pink-500", 600: "pink-600", 700: "pink-700" },
  slate:   { 50: "slate-50", 100: "slate-100", 200: "slate-200", 300: "slate-300", 400: "slate-400", 500: "slate-500", 600: "slate-600", 700: "slate-700" },
};

/** Configuración de color para un estado */
export type StatusColorConfig = {
  color: ColorName;
  label: string;
  description: string;
};

/**
 * THEME PRINCIPAL: Configuración de colores por estado de orden
 * 
 * Esta es la ÚNICA fuente de verdad para asignar colores a estados.
 * Modificar aquí afecta automáticamente a toda la aplicación.
 */
export const STATUS_THEME: Record<OrderStatus, StatusColorConfig> = {
  DRAFT:           { color: "gray",    label: "Borrador",       description: "Órdenes en borrador" },
  CONFIRMED:       { color: "blue",    label: "Confirmada",     description: "Órdenes confirmadas" },
  PAYMENT_PENDING: { color: "indigo",  label: "Pago pendiente", description: "Órdenes esperando pago" },
  PAID:            { color: "teal",    label: "Pagada",         description: "Órdenes pagadas" },
  IN_PROGRESS:     { color: "purple",  label: "En proceso",     description: "Órdenes en preparación" },
  READY:           { color: "amber",   label: "Lista",          description: "Órdenes listas para entrega" },
  ON_THE_WAY:      { color: "cyan",    label: "En camino",      description: "Órdenes en entrega" },
  COMPLETED:       { color: "emerald", label: "Completada",     description: "Órdenes completadas" },
  CANCELLED:       { color: "pink",    label: "Cancelada",      description: "Órdenes canceladas" },
  ABANDONED:       { color: "slate",   label: "Abandonada",     description: "Órdenes abandonadas" },
};

/** Tokens semánticos para construir clases CSS */
export type SemanticTokens = {
  bg: string;
  bgMedium: string;
  bgHover: string;
  border: string;
  borderHover: string;
  text: string;
  textMedium: string;
  dot: string;
  ring: string;
  accent: string;
};

/**
 * Obtiene los tokens semánticos para un estado de orden
 * Usa el COLOR_PALETTE para construir las clases de Tailwind
 */
export function getStatusTokens(status: OrderStatus): SemanticTokens {
  const { color } = STATUS_THEME[status];
  const palette = COLOR_PALETTE[color];
  
  return {
    bg: `bg-${palette[50]}`,
    bgMedium: `bg-${palette[100]}`,
    bgHover: `bg-${palette[200]}`,
    border: `border-${palette[200]}`,
    borderHover: `border-${palette[300]}`,
    text: `text-${palette[700]}`,
    textMedium: `text-${palette[600]}`,
    dot: `bg-${palette[500]}`,
    ring: `ring-${palette[400]}`,
    accent: `bg-${palette[500]}`,
  };
}

/**
 * Añade opacidad a una clase de Tailwind
 * Ej: withOpacity("bg-blue-500", 0.5) → "bg-blue-500/50"
 */
export function withOpacity(className: string, opacity: number): string {
  return `${className}/${Math.round(opacity * 100)}`;
}

/**
 * Obtiene la configuración completa de un estado
 */
export function getStatusConfig(status: OrderStatus): StatusColorConfig {
  return STATUS_THEME[status];
}

/**
 * Obtiene solo el nombre del color para un estado
 */
export function getStatusColorName(status: OrderStatus): ColorName {
  return STATUS_THEME[status].color;
}

/**
 * Obtiene el label traducido para un estado
 */
export function getStatusLabel(status: OrderStatus): string {
  return STATUS_THEME[status].label;
}

/**
 * Obtiene la descripción para un estado
 */
export function getStatusDescription(status: OrderStatus): string {
  return STATUS_THEME[status].description;
}

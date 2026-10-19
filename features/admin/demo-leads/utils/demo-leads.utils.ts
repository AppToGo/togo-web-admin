/**
 * Utilidades y constantes compartidas del Mini CRM de posibles clientes (demo-leads).
 */

import type { DemoLeadPriority, DemoLeadStage } from "@/types/auth.types";

export const DEMO_LEAD_STAGES: readonly DemoLeadStage[] = [
  "NEW",
  "ACTIVE_DEMO",
  "FOLLOW_UP",
  "CONTACTED",
  "NEGOTIATION",
  "CUSTOMER",
  "LOST",
];

export const DEMO_LEAD_PRIORITIES: readonly DemoLeadPriority[] = [
  "HIGH",
  "NORMAL",
  "LOW",
];

/**
 * Formatea una fecha ISO según el locale activo.
 */
export function formatDateTime(
  iso: string | null | undefined,
  locale: string,
): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * Formatea un número de teléfono asegurando un único prefijo '+'.
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  return phone.startsWith("+") ? phone : `+${phone}`;
}

/**
 * Convierte una fecha ISO al formato requerido por <input type="datetime-local" />.
 */
export function toInputDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Convierte el valor de un input datetime-local a ISO string de forma segura.
 * Devuelve null si está vacío o si la fecha no es válida.
 */
export function parseOptionalIsoDateTime(
  value: FormDataEntryValue | null,
): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/**
 * Devuelve la variante visual de Badge para la prioridad comercial del lead.
 */
export function priorityVariant(
  priority: DemoLeadPriority | string,
): "default" | "secondary" | "destructive" | "outline" {
  if (priority === "HIGH") return "destructive";
  if (priority === "LOW") return "outline";
  return "secondary";
}

/**
 * Obtiene una etiqueta i18n con repliegue seguro al código crudo si la clave no existe.
 */
export function safeLabel(
  t: (key: string) => string,
  key: string,
  fallback: string,
): string {
  try {
    return t(key);
  } catch {
    return fallback;
  }
}

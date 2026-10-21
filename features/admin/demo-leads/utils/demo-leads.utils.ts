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
  locale: string
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
  value: FormDataEntryValue | null
): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/**
 * Obtiene una etiqueta i18n con repliegue seguro al código crudo si la clave no existe.
 */
export function safeLabel(
  t: (key: string) => string,
  key: string,
  fallback: string
): string {
  try {
    return t(key);
  } catch {
    return fallback;
  }
}

/** Punto de color de cada etapa en el tablero (mismo patrón que Pedidos). */
export const STAGE_DOT_CLASS: Record<DemoLeadStage, string> = {
  NEW: "bg-indigo-500",
  ACTIVE_DEMO: "bg-violet-500",
  FOLLOW_UP: "bg-amber-500",
  CONTACTED: "bg-sky-500",
  NEGOTIATION: "bg-teal-500",
  CUSTOMER: "bg-emerald-500",
  LOST: "bg-slate-400",
};

/** Etiqueta de prioridad en la tarjeta: alta resalta, baja se apaga. */
export const PRIORITY_PILL_CLASS: Record<DemoLeadPriority, string> = {
  HIGH: "bg-red-100 text-red-800",
  NORMAL: "bg-slate-100 text-slate-600",
  LOW: "bg-slate-50 text-slate-500",
};

/** La próxima acción venció si su fecha ya pasó. */
export function isOverdue(nextActionAt: string | null | undefined): boolean {
  if (!nextActionAt) return false;
  const time = new Date(nextActionAt).getTime();
  return !Number.isNaN(time) && time < Date.now();
}

/** "hace 2 h", "ayer", "en 3 días": distancia a ahora en la unidad más útil. */
export function formatRelative(
  iso: string | null | undefined,
  locale: string
): string {
  if (!iso) return "—";
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return iso;
  const diffSec = Math.round((time - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  const rtf = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
    style: "short",
  });
  for (const [unit, seconds] of units) {
    if (Math.abs(diffSec) >= seconds) {
      return rtf.format(Math.round(diffSec / seconds), unit);
    }
  }
  return rtf.format(0, "minute");
}

const COLLAPSED_STAGES_STORAGE_KEY = "togo-demo-leads-collapsed-stages";
/** Cliente y Perdido arrancan colapsadas: las que menos se revisan a diario. */
const DEFAULT_COLLAPSED_STAGES: Partial<Record<DemoLeadStage, boolean>> = {
  CUSTOMER: true,
  LOST: true,
};

/**
 * Etapas colapsadas guardadas en este navegador (mismo patrón que las
 * columnas de Pedidos). Se lee en el inicializador del estado: la página
 * no se renderiza en el servidor.
 */
export function readCollapsedStages(): Partial<Record<DemoLeadStage, boolean>> {
  try {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem(COLLAPSED_STAGES_STORAGE_KEY)
        : null;
    return saved
      ? { ...DEFAULT_COLLAPSED_STAGES, ...JSON.parse(saved) }
      : DEFAULT_COLLAPSED_STAGES;
  } catch {
    return DEFAULT_COLLAPSED_STAGES;
  }
}

export function saveCollapsedStages(
  value: Partial<Record<DemoLeadStage, boolean>>
): void {
  try {
    localStorage.setItem(COLLAPSED_STAGES_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Sin localStorage (modo privado): la preferencia dura la sesión.
  }
}

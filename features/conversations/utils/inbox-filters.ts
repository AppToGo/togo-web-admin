import { getRangeFromPreset, type DateFilterValue } from "@/features/filters/stores";
import type { GetConversationsParams, InboxFiltersValue, InboxView } from "../types";

/** Al entrar al inbox: todas las conversaciones, sin filtro de fecha. */
export const DEFAULT_INBOX_FILTERS: InboxFiltersValue = { view: "all", date: null };

function viewParams(view: InboxView): GetConversationsParams {
  switch (view) {
    case "waiting":
      return { control: ["PENDING_HUMAN"] };
    case "mine":
      return { assignedTo: "me" };
    case "unassigned":
      return { control: ["HUMAN"], assignedTo: "unassigned" };
    case "all":
    default:
      return {};
  }
}

/** Día calendario válido ("YYYY-MM-DD") o `null` si el texto no lo es. */
function parseDay(value: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  // Round-trip: febrero 30 o mes 13 "rotan" en el constructor y no valen.
  const check = new Date(y, m - 1, d);
  if (check.getFullYear() !== y || check.getMonth() !== m - 1 || check.getDate() !== d) {
    return null;
  }
  return { y, m, d };
}

/**
 * El backend filtra `startedAt` entre `dateFrom` y `dateTo` tal cual llegan:
 * con "YYYY-MM-DD" a secas `dateTo` sería la medianoche UTC del inicio del
 * día y dejaría afuera ese día entero. Se mandan los bordes del día local
 * completo como ISO.
 *
 * Los presets ("Hoy", "Esta semana"…) se recalculan acá y no se toma el
 * rango guardado al elegirlos: con el inbox abierto de un día para el otro,
 * "Hoy" tiene que seguir siendo hoy.
 */
function dateParams(date: DateFilterValue | null): GetConversationsParams {
  if (!date) return {};
  const range = date.preset === "custom" ? date.range : getRangeFromPreset(date.preset);
  const from = parseDay(range.from);
  const to = parseDay(range.to);
  // Rango interno siempre válido; si llegara uno malformado se ignora la
  // fecha en vez de romper el render con un RangeError de `toISOString`.
  if (!from || !to) return {};
  return {
    dateFrom: new Date(from.y, from.m - 1, from.d, 0, 0, 0, 0).toISOString(),
    dateTo: new Date(to.y, to.m - 1, to.d, 23, 59, 59, 999).toISOString(),
  };
}

/** Filtros del inbox → query params de `GET /conversations`. */
export function inboxFiltersToParams(filters: InboxFiltersValue): GetConversationsParams {
  return { ...viewParams(filters.view), ...dateParams(filters.date) };
}

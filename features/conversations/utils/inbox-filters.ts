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
  const [fromY, fromM, fromD] = range.from.split("-").map(Number);
  const [toY, toM, toD] = range.to.split("-").map(Number);
  return {
    dateFrom: new Date(fromY, fromM - 1, fromD, 0, 0, 0, 0).toISOString(),
    dateTo: new Date(toY, toM - 1, toD, 23, 59, 59, 999).toISOString(),
  };
}

/** Filtros del inbox → query params de `GET /conversations`. */
export function inboxFiltersToParams(filters: InboxFiltersValue): GetConversationsParams {
  return { ...viewParams(filters.view), ...dateParams(filters.date) };
}

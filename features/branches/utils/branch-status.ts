import type { Branch } from "../types";
import { BUSINESS_HOURS_DAYS, parseBusinessHours } from "../types/branch-config.types";
import type { DaySchedule } from "../types/branch-config.types";

/**
 * Estado de la sede para la tarjeta y el encabezado del detalle: uno solo y
 * legible (antes eran hasta tres badges: activa, abierto y principal).
 *
 * - `off`: la sede está desactivada, no recibe pedidos.
 * - `open` / `closed`: lo calcula el backend (`acceptingOrdersStatus`).
 * - `always`: sin horario cargado, acepta pedidos a toda hora.
 */
export type BranchStatusKind = "open" | "closed" | "closedManually" | "always" | "off";

export interface BranchStatus {
  kind: BranchStatusKind;
  /** Hora "HH:mm" para el detalle ("hasta 22:00", "abre a las 11:00"). */
  time?: string;
  /**
   * Qué significa `time`: hasta cuándo sigue así hoy, a qué hora abre hoy, o
   * (`untilDate`) que el cierre manual termina otro día: ver `untilIso`.
   */
  timeKind?: "until" | "opensAt" | "untilDate";
  /** Instante en que termina el cierre/apertura manual, si no es hoy. */
  untilIso?: string;
}

/** Día de la semana, fecha y hora "HH:mm" de un instante en la zona de la sede. */
function nowIn(timezone: string, now: Date): { day: string; date: string; time: string } {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    return {
      day: get("weekday").toLowerCase(),
      date: `${get("year")}-${get("month")}-${get("day")}`,
      time: `${get("hour")}:${get("minute")}`,
    };
  } catch {
    return { day: "", date: "", time: "" };
  }
}

/** Horario de hoy y de ayer (el turno nocturno de ayer puede seguir abierto). */
function schedulesNow(
  branch: Branch,
  now: Date
): { today: DaySchedule | null; yesterday: DaySchedule | null; time: string } {
  const hours = parseBusinessHours(branch.businessHours, branch.timezone);
  if (!hours) return { today: null, yesterday: null, time: "" };
  const { day, time } = nowIn(hours.timezone, now);
  const index = BUSINESS_HOURS_DAYS.findIndex((d) => d === day);
  if (index < 0) return { today: null, yesterday: null, time };
  const yesterdayKey = BUSINESS_HOURS_DAYS[(index + 6) % 7];
  return {
    today: hours.schedule[BUSINESS_HOURS_DAYS[index]],
    yesterday: hours.schedule[yesterdayKey],
    time,
  };
}

export function getBranchStatus(branch: Branch, now: Date = new Date()): BranchStatus {
  if (!branch.isActive) return { kind: "off" };
  const status = branch.acceptingOrdersStatus;
  if (!status || status.motivo === "SIN_CONFIGURAR") return { kind: "always" };

  if (status.motivo === "OVERRIDE") {
    const kind = status.aceptando ? "open" : "closedManually";
    const until = status.hasta ? new Date(status.hasta) : null;
    if (!until || Number.isNaN(until.getTime())) return { kind };
    const end = nowIn(branch.timezone, until);
    // Si termina otro día, la hora sola engaña ("hasta las 10:00" ¿de hoy?).
    return end.date === nowIn(branch.timezone, now).date
      ? { kind, time: end.time, timeKind: "until" }
      : { kind, untilIso: status.hasta ?? undefined, timeKind: "untilDate" };
  }

  const { today, yesterday, time: nowTime } = schedulesNow(branch, now);
  if (status.aceptando) {
    // Turno nocturno de ayer todavía abierto (ej. viernes 17:00–02:00 y es
    // sábado 01:00): cierra a la hora de ayer, no a la de hoy.
    const overnight =
      yesterday?.isOpen &&
      yesterday.open &&
      yesterday.close &&
      yesterday.close < yesterday.open &&
      nowTime &&
      nowTime < yesterday.close;
    if (overnight) return { kind: "open", time: yesterday.close, timeKind: "until" };
    return today?.isOpen && today.close
      ? { kind: "open", time: today.close, timeKind: "until" }
      : { kind: "open" };
  }
  if (today?.isOpen && today.open && nowTime && nowTime < today.open) {
    return { kind: "closed", time: today.open, timeKind: "opensAt" };
  }
  return { kind: "closed" };
}

/** Filtros del listado: abiertas incluye las que no tienen horario. */
export type BranchFilter = "all" | "open" | "closed" | "off";

export function matchesBranchFilter(status: BranchStatus, filter: BranchFilter): boolean {
  if (filter === "all") return true;
  if (filter === "off") return status.kind === "off";
  if (filter === "open") return status.kind === "open" || status.kind === "always";
  return status.kind === "closed" || status.kind === "closedManually";
}

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
  /** Qué significa `time`: hasta cuándo sigue así o a qué hora abre hoy. */
  timeKind?: "until" | "opensAt";
}

/** Día de la semana y hora "HH:mm" actuales en la zona horaria de la sede. */
function nowIn(timezone: string, now: Date): { day: string; time: string } {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    return {
      day: get("weekday").toLowerCase(),
      time: `${get("hour")}:${get("minute")}`,
    };
  } catch {
    return { day: "", time: "" };
  }
}

function todaySchedule(branch: Branch, now: Date): { schedule: DaySchedule | null; time: string } {
  const hours = parseBusinessHours(branch.businessHours, branch.timezone);
  if (!hours) return { schedule: null, time: "" };
  const { day, time } = nowIn(hours.timezone, now);
  const key = BUSINESS_HOURS_DAYS.find((d) => d === day);
  return { schedule: key ? hours.schedule[key] : null, time };
}

/** Hora local "HH:mm" de un instante ISO en la zona de la sede. */
function timeOf(iso: string, timezone: string): string | undefined {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return nowIn(timezone, date).time || undefined;
}

export function getBranchStatus(branch: Branch, now: Date = new Date()): BranchStatus {
  if (!branch.isActive) return { kind: "off" };
  const status = branch.acceptingOrdersStatus;
  if (!status || status.motivo === "SIN_CONFIGURAR") return { kind: "always" };

  if (status.motivo === "OVERRIDE") {
    const time = status.hasta ? timeOf(status.hasta, branch.timezone) : undefined;
    return {
      kind: status.aceptando ? "open" : "closedManually",
      ...(time ? { time, timeKind: "until" as const } : {}),
    };
  }

  const { schedule, time: nowTime } = todaySchedule(branch, now);
  if (status.aceptando) {
    return schedule?.isOpen && schedule.close
      ? { kind: "open", time: schedule.close, timeKind: "until" }
      : { kind: "open" };
  }
  if (schedule?.isOpen && schedule.open && nowTime && nowTime < schedule.open) {
    return { kind: "closed", time: schedule.open, timeKind: "opensAt" };
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

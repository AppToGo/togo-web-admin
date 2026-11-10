import type { DemoFunnelChannel } from "@/types/auth.types";

/** Zona del embudo: la API agrupa por día de Bogotá (UTC-5, sin horario de verano). */
const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const FUNNEL_CHANNELS: readonly DemoFunnelChannel[] = [
  "AD",
  "WEB",
  "DIRECT",
];

/** Fecha YYYY-MM-DD de hoy en Bogotá, desplazada `daysAgo` días. */
export function bogotaDate(daysAgo = 0): string {
  return new Date(Date.now() - BOGOTA_OFFSET_MS - daysAgo * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** Porcentaje entero de `part` sobre `total`; null si no hay base. */
export function percentOf(part: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((part / total) * 100);
}

export type FunnelRangePreset = "7" | "30" | "custom";

/** Preset activo según from/to de la URL (sin ninguno: 30 días, el de la API). */
export function detectRangePreset(
  from: string | null,
  to: string | null
): FunnelRangePreset {
  if (!from && !to) return "30";
  const today = bogotaDate();
  if (to === today && from === bogotaDate(6)) return "7";
  if (to === today && from === bogotaDate(29)) return "30";
  return "custom";
}

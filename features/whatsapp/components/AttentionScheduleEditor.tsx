/**
 * Editor del horario de atención (F2/F5), compartido por la tarjeta del
 * negocio y la de la sede: una fila por día con apertura y cierre "HH:MM".
 */

"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";

export type AttentionMode = "BOT_ONLY" | "ATTENTION_MANUAL" | "HYBRID";

export const DAY_KEYS = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
] as const;

export interface DayRow {
  enabled: boolean;
  open: string;
  close: string;
}

type ScheduleEntry = { day: number; open: string; close: string };

/** Filas de los 7 días a partir del horario guardado (día sin entrada = apagado). */
export function scheduleRows(schedule: unknown): DayRow[] {
  const rows: DayRow[] = DAY_KEYS.map(() => ({
    enabled: false,
    open: "08:00",
    close: "18:00",
  }));
  if (!Array.isArray(schedule)) return rows;
  for (const entry of schedule as Partial<ScheduleEntry>[]) {
    if (
      entry &&
      typeof entry.day === "number" &&
      entry.day >= 0 &&
      entry.day < 7
    ) {
      rows[entry.day] = {
        enabled: true,
        open: typeof entry.open === "string" ? entry.open : "08:00",
        close: typeof entry.close === "string" ? entry.close : "18:00",
      };
    }
  }
  return rows;
}

/** Lo que se guarda: solo los días marcados. */
export function schedulePayload(days: DayRow[]): ScheduleEntry[] {
  return days
    .map((row, day) => ({ day, ...row }))
    .filter((row) => row.enabled)
    .map(({ day, open, close }) => ({ day, open, close }));
}

/** Un horario guardado con al menos un día (vacío = heredar). */
export function hasOwnSchedule(schedule: unknown): boolean {
  return Array.isArray(schedule) && schedule.length > 0;
}

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Día marcado con horas válidas y cierre después de la apertura. */
export function rowValid(row: DayRow): boolean {
  return (
    !row.enabled ||
    (HH_MM.test(row.open) && HH_MM.test(row.close) && row.open < row.close)
  );
}

export function AttentionScheduleEditor({
  days,
  onChange,
}: {
  days: DayRow[];
  onChange: (days: DayRow[]) => void;
}) {
  const t = useTranslations("whatsapp");
  const updateDay = (day: number, patch: Partial<DayRow>) =>
    onChange(days.map((row, i) => (i === day ? { ...row, ...patch } : row)));

  return (
    <>
      <div className="mt-2 space-y-1.5">
        {DAY_KEYS.map((dayKey, day) => (
          <div key={dayKey} className="flex items-center gap-2 text-sm">
            <label className="flex w-24 cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={days[day].enabled}
                onChange={(e) => updateDay(day, { enabled: e.target.checked })}
              />
              <span className="text-slate-700">
                {t(`attention.days.${dayKey}`)}
              </span>
            </label>
            <Input
              type="time"
              value={days[day].open}
              disabled={!days[day].enabled}
              onChange={(e) => updateDay(day, { open: e.target.value })}
              className="h-9 w-28 rounded-lg border-0 bg-slate-100 disabled:opacity-40"
            />
            <span className="text-slate-400">–</span>
            <Input
              type="time"
              value={days[day].close}
              disabled={!days[day].enabled}
              onChange={(e) => updateDay(day, { close: e.target.value })}
              className="h-9 w-28 rounded-lg border-0 bg-slate-100 disabled:opacity-40"
            />
          </div>
        ))}
      </div>
      {!days.every(rowValid) && (
        <p className="mt-1.5 text-xs text-red-600">
          {t("attention.rangeError")}
        </p>
      )}
    </>
  );
}

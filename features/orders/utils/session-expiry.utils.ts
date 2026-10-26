/**
 * Horas de cierre para una sesión del modo operador del catálogo: cada
 * `stepMinutes` desde ahora hasta el cierre del turno de la sede, que puede
 * ser del día siguiente (un negocio que abre a las 17:00 y cierra a las
 * 02:00). La última opción es siempre el cierre exacto, el que valida la API.
 */

export interface SessionExpiryOption {
  /** ISO que se manda como `expiresAt` */
  value: string;
  /** La hora cae otro día que hoy, en la zona de la sede */
  nextDay: boolean;
}

/** Margen mínimo que exige la API entre ahora y el cierre elegido. */
const MIN_SESSION_MINUTES = 5;

/** Fecha calendario en la zona de la sede ("2026-10-26"). */
function dayInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function buildSessionExpiryOptions(
  closesAt: string,
  timeZone: string,
  now: Date = new Date(),
  stepMinutes = 30
): SessionExpiryOption[] {
  const closes = new Date(closesAt).getTime();
  const earliest = now.getTime() + MIN_SESSION_MINUTES * 60_000;
  if (closes < earliest) return [];

  const stepMs = stepMinutes * 60_000;
  const today = dayInZone(now, timeZone);
  const option = (time: number): SessionExpiryOption => {
    const date = new Date(time);
    return {
      value: date.toISOString(),
      nextDay: dayInZone(date, timeZone) !== today,
    };
  };

  const options: SessionExpiryOption[] = [];
  // Horas "redondas" (en punto y media): las zonas de Latinoamérica tienen
  // offsets de horas enteras, así que la grilla en UTC coincide con la local.
  for (
    let time = Math.ceil(earliest / stepMs) * stepMs;
    time < closes;
    time += stepMs
  ) {
    options.push(option(time));
  }
  options.push(option(closes));
  return options;
}

import type { useTranslations } from "next-intl";

type CustomersT = ReturnType<typeof useTranslations<"customers">>;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Fecha de la última compra en palabras ("Hoy", "Ayer", "Hace 3 días",
 * "Hace 2 semanas", "12 oct"). `t` es el traductor de `customers`.
 */
export function formatRelativeDate(
  date: Date | string | null,
  t: CustomersT
): string {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / DAY_MS);

  // Fecha futura: unos minutos de desfase de reloj cuentan como hoy; más
  // allá se muestra la fecha en vez de "Hace -3 días".
  if (diffMs < 0) {
    return -diffMs < DAY_MS
      ? t("dates.today")
      : d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  }
  if (diffDays === 0) return t("dates.today");
  if (diffDays === 1) return t("dates.yesterday");
  if (diffDays < 7) return t("dates.daysAgo", { count: diffDays });
  if (diffDays < 30)
    return t("dates.weeksAgo", { count: Math.floor(diffDays / 7) });
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

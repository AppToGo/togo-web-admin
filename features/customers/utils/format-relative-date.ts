import type { useTranslations } from "next-intl";

type CustomersT = ReturnType<typeof useTranslations<"customers">>;

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
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return t("dates.today");
  if (diffDays === 1) return t("dates.yesterday");
  if (diffDays < 7) return t("dates.daysAgo", { count: diffDays });
  if (diffDays < 30)
    return t("dates.weeksAgo", { count: Math.floor(diffDays / 7) });
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

"use client";

import { useLocale, useNow, useTranslations } from "next-intl";

/**
 * Hora del último mensaje en las listas del Inbox (escritorio y teléfono):
 * "ahora", "4 min", "12:10" (hoy), "Ayer" o "12 oct". Devuelve un
 * formateador para usarlo dentro de un `map`; `useNow` lo refresca cada
 * minuto para que "ahora" o "4 min" no se queden congelados.
 */
export function useListTime(): (iso: string) => string {
  const t = useTranslations("inbox.list.time");
  const locale = useLocale();
  const now = useNow({ updateInterval: 60_000 });

  return (iso: string) => {
    const date = new Date(iso);
    const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);

    if (minutes < 1) return t("now");
    if (minutes < 60) return t("minutes", { count: minutes });

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    if (date >= startOfToday) {
      return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
    }
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    if (date >= startOfYesterday) return t("yesterday");

    return date.toLocaleDateString(locale, { day: "numeric", month: "short" });
  };
}

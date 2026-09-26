"use client";

import { useTranslations } from "next-intl";

/** Tasa de 0 a 1 como porcentaje; "—" si no hay datos. */
export function formatRate(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(
    value
  );
}

/** `part / total` como tasa, o null si no hay total. */
export function ratio(part: number, total: number): number | null {
  return total > 0 ? part / total : null;
}

/**
 * Nombre legible de un estado de la conversación del bot. Un estado nuevo
 * del backend que todavía no tenga traducción se muestra tal cual.
 */
export function useFunnelStateLabel() {
  const t = useTranslations("conversations.funnel.states");
  return (state: string) => (state && t.has(state) ? t(state) : state || "—");
}

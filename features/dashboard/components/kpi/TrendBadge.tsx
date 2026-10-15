"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface TrendBadgeProps {
  /** Variación porcentual contra el período anterior. */
  value: number;
}

/** Etiqueta de tendencia: verde si sube, roja si baja, gris si no cambia. */
export function TrendBadge({ value }: TrendBadgeProps) {
  const t = useTranslations("dashboard.trend");
  const formatted = Math.abs(value).toFixed(1);
  const label =
    value > 0
      ? t("up", { value: formatted })
      : value < 0
        ? t("down", { value: formatted })
        : t("neutral");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-badge px-2 py-0.5 text-xs font-semibold tabular-nums",
        value > 0 && "bg-emerald-100/80 text-emerald-700",
        value < 0 && "bg-red-100/85 text-red-700",
        value === 0 && "bg-white/70 text-slate-600"
      )}
    >
      {label}
    </span>
  );
}

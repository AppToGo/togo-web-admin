"use client";

import { memo } from "react";
import {
  progressBarContainerVariants,
  progressBarFillVariants,
} from "@/shared/styles/metrics";
import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  /** Valor actual de la barra */
  value: number;
  /** Valor máximo para calcular el porcentaje */
  max: number;
  /** Color del fill de la barra */
  color: "blue" | "purple" | "amber" | "cyan" | "emerald";
  /** Tamaño de la barra */
  size?: "sm" | "md";
  /** Mostrar etiqueta con valores */
  showLabel?: boolean;
  /** Formateador personalizado para la etiqueta */
  labelFormatter?: (value: number, max: number) => string;
  /** Clases adicionales */
  className?: string;
  /** Clases adicionales para el fill */
  fillClassName?: string;
}

/**
 * ProgressBar - Componente estandarizado para barras de progreso
 *
 * Usado en métricas para mostrar proporciones y distribuciones.
 * Basado en el patrón visual de OrderMetrics.
 */
export const ProgressBar = memo(function ProgressBar({
  value,
  max,
  color,
  size = "md",
  showLabel = false,
  labelFormatter,
  className,
  fillClassName,
}: ProgressBarProps) {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  const defaultFormatter = (v: number, m: number) =>
    `${v} / ${m}`;

  const label = labelFormatter
    ? labelFormatter(value, max)
    : defaultFormatter(value, max);

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-slate-600">{label}</span>
          <span className="text-sm font-medium text-slate-700">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div
        className={progressBarContainerVariants({
          size: size === "sm" ? "sm" : "md",
        })}
      >
        <div
          className={cn(
            progressBarFillVariants({ color }),
            fillClassName
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={showLabel ? label : undefined}
        />
      </div>
    </div>
  );
});

export default ProgressBar;

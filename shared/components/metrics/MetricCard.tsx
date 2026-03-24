"use client";

import { memo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  metricCardVariants,
  metricIconContainerVariants,
  metricIconColorVariants,
} from "@/shared/styles/metrics";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  /** Título de la métrica */
  title: string;
  /** Valor principal a mostrar */
  value: string | number;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Icono de Lucide */
  icon?: LucideIcon;
  /** Esquema de color */
  colorScheme: "indigo" | "emerald" | "amber" | "blue" | "purple" | "slate";
  /** Usar gradiente como fondo */
  isGradient?: boolean;
  /** Tamaño de la card */
  size?: "sm" | "md" | "lg";
  /** Mostrar borde en el header */
  showHeaderBorder?: boolean;
  /** Clases adicionales */
  className?: string;
  /** Contenido adicional debajo del valor principal */
  children?: React.ReactNode;
}

/**
 * MetricCard - Card estandarizada para métricas individuales
 *
 * Soporta:
 * - Múltiples esquemas de color
 * - Modo gradiente para métricas principales
 * - Icono con fondo coloreado
 * - Subtítulo descriptivo
 */
export const MetricCard = memo(function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme,
  isGradient = false,
  size = "md",
  showHeaderBorder = false,
  className,
  children,
}: MetricCardProps) {
  const textColorClass = isGradient ? "text-white" : "text-slate-900";
  const titleColorClass = isGradient
    ? "text-white/70"
    : "text-slate-500";
  const subtitleColorClass = isGradient
    ? "text-white/50"
    : "text-slate-400";

  return (
    <div
      className={cn(
        metricCardVariants({
          colorScheme,
          size,
          isGradient,
          showHeaderBorder,
        }),
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium mb-1", titleColorClass)}>
            {title}
          </p>
          <p
            className={cn(
              "font-bold truncate",
              size === "sm" && "text-xl",
              size === "md" && "text-2xl",
              size === "lg" && "text-3xl",
              textColorClass
            )}
          >
            {value}
          </p>
          {subtitle && (
            <p
              className={cn(
                "text-xs mt-0.5",
                subtitleColorClass
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              metricIconContainerVariants({ colorScheme }),
              isGradient && "bg-white/20"
            )}
          >
            <Icon
              className={cn(
                metricIconColorVariants({ colorScheme }),
                isGradient && "text-white"
              )}
            />
          </div>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
});

export default MetricCard;

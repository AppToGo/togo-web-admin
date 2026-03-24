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
  /** Tipo de variante de card: glass (glassmorphism) o gradient (destacada) */
  variantType?: "glass" | "gradient";
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
 * - Dos tipos de cards: glass (glassmorphism) y gradient (destacada)
 * - Icono con fondo coloreado
 * - Subtítulo descriptivo
 *
 * @example
 * // Card normal (glassmorphism) - para contenido general
 * <MetricCard
 *   title="Total"
 *   value="1,234"
 *   variantType="glass"
 *   size="md"
 * />
 *
 * @example
 * // Card destacada (gradiente) - para métricas importantes
 * <MetricCard
 *   title="Revenue"
 *   value="$12,345"
 *   variantType="gradient"
 *   colorScheme="indigo"
 *   size="md"
 * />
 */
export const MetricCard = memo(function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme,
  variantType = "glass",
  size = "md",
  showHeaderBorder = false,
  className,
  children,
}: MetricCardProps) {
  // Glass cards use dark text, gradient cards use white text
  const isGradient = variantType === "gradient";
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
          variantType,
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

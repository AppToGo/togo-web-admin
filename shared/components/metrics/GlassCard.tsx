"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const glassCardVariants = cva("overflow-hidden", {
  variants: {
    variant: {
      glass:
        "rounded-card-xl bg-white/30 backdrop-blur-xl border border-white/40",
      gradient: "rounded-card-lg shadow-card",
      solid: "rounded-card-lg bg-white border border-slate-100 shadow-card",
    },
    colorScheme: {
      indigo: "",
      emerald: "",
      amber: "",
      blue: "",
      purple: "",
      slate: "",
    },
  },
  compoundVariants: [
    // Gradient variants
    {
      variant: "gradient",
      colorScheme: "indigo",
      class: "bg-gradient-indigo-purple text-white",
    },
    {
      variant: "gradient",
      colorScheme: "emerald",
      class: "bg-gradient-emerald-teal text-white",
    },
    {
      variant: "gradient",
      colorScheme: "amber",
      class: "bg-gradient-orange-amber text-white",
    },
    {
      variant: "gradient",
      colorScheme: "blue",
      class: "bg-gradient-blue-cyan text-white",
    },
    {
      variant: "gradient",
      colorScheme: "purple",
      class: "bg-gradient-purple-indigo text-white",
    },
    {
      variant: "gradient",
      colorScheme: "slate",
      class: "bg-gradient-slate-dark text-white",
    },
  ],
  defaultVariants: {
    variant: "glass",
    colorScheme: "indigo",
  },
});

export interface GlassCardHeader {
  /** Título del header */
  title: string;
  /** Icono opcional a mostrar junto al título */
  icon?: React.ReactNode;
  /** Contenido adicional a la derecha del header */
  rightContent?: React.ReactNode;
}

export interface GlassCardProps extends VariantProps<typeof glassCardVariants> {
  /** Contenido de la card */
  children: React.ReactNode;
  /** Clases adicionales */
  className?: string;
  /** Configuración del header opcional */
  header?: GlassCardHeader;
  /** Padding del contenido (default: p-4) */
  contentPadding?: "none" | "sm" | "md" | "lg";
}

const contentPaddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

/**
 * GlassCard - Contenedor genérico con variantes de estilo
 *
 * Soporta:
 * - Variant glass: Efecto glassmorphism (fondo translúcido con blur)
 * - Variant gradient: Fondo con gradiente según colorScheme
 * - Variant solid: Card blanca sólida con borde
 * - Header opcional con icono y contenido derecho
 */
export function GlassCard({
  children,
  variant,
  colorScheme,
  className,
  header,
  contentPadding = "md",
}: GlassCardProps) {
  const isGradient = variant === "gradient";
  const isGlass = variant === "glass";
  const isSolid = variant === "solid";

  return (
    <div className={cn(glassCardVariants({ variant, colorScheme }), className)}>
      {header && (
        <div
          className={cn(
            "flex items-center justify-between px-5 py-4",
            isGlass && "border-b border-white/20",
            isGradient && "border-b border-white/20",
            isSolid && "border-b border-slate-100"
          )}
        >
          <div className="flex items-center gap-2">
            {header.icon}
            <span
              className={cn(
                "text-sm font-semibold",
                isGradient ? "text-white" : "text-slate-700"
              )}
            >
              {header.title}
            </span>
          </div>
          {header.rightContent && (
            <div
              className={cn(
                "text-xs",
                isGradient ? "text-white/70" : "text-slate-500"
              )}
            >
              {header.rightContent}
            </div>
          )}
        </div>
      )}
      <div className={contentPaddingClasses[contentPadding]}>{children}</div>
    </div>
  );
}

export default GlassCard;

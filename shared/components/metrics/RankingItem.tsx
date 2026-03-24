"use client";

import { memo } from "react";
import Link from "next/link";
import { Medal, ExternalLink } from "lucide-react";
import {
  rankingItemVariants,
  rankBadgeVariants,
  getRankingColor,
} from "@/shared/styles/metrics";
import { cn } from "@/lib/utils";

export interface RankingItemProps {
  /** Posición en el ranking (1-based) */
  position: number;
  /** Nombre del item */
  name: string;
  /** Valor a mostrar (opcional) */
  value?: string | number;
  /** Subtítulo o descripción adicional */
  subtitle?: string;
  /** Si es clickable (activa hover states) */
  isClickable?: boolean;
  /** Callback al hacer click */
  onClick?: () => void;
  /** Link URL si es navegable */
  href?: string;
  /** Clases adicionales */
  className?: string;
  /** Contenido adicional al lado del valor */
  extraContent?: React.ReactNode;
}

/**
 * RankingItem - Item estandarizado para listas de ranking
 *
 * Soporta:
 * - Top 3 con medallas (oro, plata, bronce)
 * - Posiciones 4+ con número
 * - Navegación vía href o onClick
 * - Valor y subtítulo opcionales
 */
export const RankingItem = memo(function RankingItem({
  position,
  name,
  value,
  subtitle,
  isClickable = false,
  onClick,
  href,
  className,
  extraContent,
}: RankingItemProps) {
  const colors = getRankingColor(position);
  const isTop3 = position <= 3;

  const content = (
    <>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Rank Badge */}
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm shrink-0",
            colors.bg,
            colors.text
          )}
        >
          {isTop3 ? (
            <Medal className={cn("h-4 w-4", colors.icon)} />
          ) : (
            position
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-medium truncate transition-colors",
              isClickable
                ? "text-slate-900 group-hover:text-indigo-600"
                : "text-slate-900"
            )}
          >
            {name}
          </p>
          {subtitle && (
            <p className="text-sm text-slate-500 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Value and actions */}
      <div className="flex items-center gap-3 shrink-0">
        {value !== undefined && (
          <span className="font-semibold text-emerald-600">{value}</span>
        )}
        {extraContent}
        {isClickable && href && (
          <ExternalLink className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </>
  );

  const containerClasses = cn(
    rankingItemVariants({
      position: isTop3 ? (position as 1 | 2 | 3) : "other",
      isClickable: !!isClickable || !!href,
    }),
    (isClickable || href) && "group",
    className
  );

  if (href) {
    return (
      <Link href={href} className={containerClasses}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={cn(containerClasses, "w-full text-left")}>
        {content}
      </button>
    );
  }

  return <div className={containerClasses}>{content}</div>;
});

export default RankingItem;

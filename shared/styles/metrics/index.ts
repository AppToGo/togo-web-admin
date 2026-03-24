/**
 * Metrics Styles - Main Export
 *
 * Punto de entrada único para todos los estilos del sistema de métricas.
 */

// Tokens
export {
  metricColors,
  rankingColors,
  metricSpacing,
  metricRadius,
  metricShadows,
  metricTypography,
  progressBarTokens,
  metricTransitions,
  headerTokens,
  type MetricColorScheme,
  type RankingColor,
  type MetricSize,
} from "./tokens";

// Variants
export {
  metricCardVariants,
  rankingItemVariants,
  rankBadgeVariants,
  progressBarContainerVariants,
  progressBarFillVariants,
  metricValueVariants,
  metricIconContainerVariants,
  metricIconColorVariants,
  metricHeaderVariants,
  type MetricCardVariantProps,
  type RankingItemVariantProps,
  type RankBadgeVariantProps,
  type ProgressBarContainerVariantProps,
  type ProgressBarFillVariantProps,
  type MetricValueVariantProps,
  type MetricIconContainerVariantProps,
  type MetricIconColorVariantProps,
  type MetricHeaderVariantProps,
} from "./variants";

// Utils
import { cn } from "@/lib/utils";

/**
 * Combina clases de métricas usando cn() de forma segura.
 * Helper utilitario para composición de clases.
 */
export function combineMetricsClasses(...inputs: Parameters<typeof cn>) {
  return cn(...inputs);
}

/**
 * Helper para obtener colores de ranking según posición.
 */
export function getRankingColor(position: number): {
  bg: string;
  text: string;
  icon: string;
} {
  switch (position) {
    case 1:
      return {
        bg: "bg-amber-100",
        text: "text-amber-700",
        icon: "text-amber-500",
      };
    case 2:
      return {
        bg: "bg-slate-100",
        text: "text-slate-700",
        icon: "text-slate-400",
      };
    case 3:
      return {
        bg: "bg-orange-100",
        text: "text-orange-700",
        icon: "text-orange-400",
      };
    default:
      return {
        bg: "bg-slate-50",
        text: "text-slate-600",
        icon: "text-slate-400",
      };
  }
}

/**
 * Helper para obtener variante de color para progress bar.
 */
export function getProgressBarColor(
  color: "blue" | "purple" | "amber" | "cyan" | "emerald"
): string {
  const colorMap = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    amber: "bg-amber-500",
    cyan: "bg-cyan-500",
    emerald: "bg-emerald-500",
  };
  return colorMap[color];
}

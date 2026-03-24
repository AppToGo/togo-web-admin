/**
 * Metrics Compatibility Layer
 *
 * Re-exports desde shared/styles/metrics para mantener compatibilidad
 * con el código existente en OrderMetrics.
 *
 * Este archivo actúa como adaptador temporal durante la migración.
 * En el futuro, los imports pueden actualizarse directamente a shared/styles/metrics.
 */

// Re-exportar variantes CVA existentes con los nombres que usa OrderMetrics
export {
  progressBarContainerVariants as progressBarVariants,
  progressBarFillVariants,
  type ProgressBarContainerVariantProps as ProgressBarVariantProps,
  type ProgressBarFillVariantProps,
} from "@/shared/styles/metrics";

// Re-exportar tokens y helpers adicionales
export {
  metricColors,
  rankingColors,
  getRankingColor,
  getProgressBarColor,
} from "@/shared/styles/metrics";

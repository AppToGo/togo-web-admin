/**
 * Order Status Theme System - Barrel Exports
 * 
 * Importar desde aquí para acceder a todo el sistema de theme.
 * 
 * @example
 * // Theme base
 * import { STATUS_THEME, getStatusTokens, getStatusColorName } from "../theme";
 * 
 * // Variantes CVA generadas
 * import { 
 *   columnVariants, 
 *   columnDragOverVariants,
 *   dotVariants 
 * } from "../theme";
 * 
 * // Utilidades generadas
 * import { STATUS_COLORS, generateColumnColors } from "../theme";
 */

// === Theme Base ===
export {
  // Constantes
  COLOR_PALETTE,
  STATUS_THEME,
  // Types
  type ColorName,
  type ColorScale,
  type StatusColorConfig,
  type SemanticTokens,
  // Funciones
  getStatusTokens,
  withOpacity,
  getStatusConfig,
  getStatusColorName,
  getStatusLabel,
  getStatusDescription,
} from "./order-status.theme";

// === Generadores CVA ===
export {
  columnVariants,
  columnDragOverVariants,
  columnHeaderVariants,
  dotVariants,
  cardContainerDragOverVariants,
  counterTextVariants,
  counterTextDragOverVariants,
  emptyStateVariants,
  emptyStateDragOverVariants,
  emptyStateIconVariants,
  emptyStateIconDragOverVariants,
  emptyStateTextVariants,
  emptyStateTextDragOverVariants,
} from "./generators/cva-generator";

// === Generadores de Utilidades ===
export {
  // Constantes
  STATUS_COLORS,
  // Types
  type StatusColorSet,
  // Funciones
  generateStatusColors,
  generateColumnColors,
  generateColumnLabels,
  generateKanbanColumnConfig,
} from "./generators/utils-generator";

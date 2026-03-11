/**
 * Kanban Column Variants
 *
 * Variantes de estilo tipadas por OrderStatus usando CVA.
 * Centraliza todos los estilos visuales de las columnas Kanban.
 * 
 * NOTA: Estas variantes se generan automáticamente desde el Theme System.
 * Para modificar colores, edita: features/orders/theme/order-status.theme.ts
 * 
 * @see features/orders/theme/generators/cva-generator.ts - Generador automático
 */

// Re-exportar todas las variantes CVA desde el theme system
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
} from "../../theme/generators/cva-generator";

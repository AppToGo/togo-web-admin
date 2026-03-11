/**
 * Kanban Column Variants
 *
 * Variantes de estilo tipadas por OrderStatus usando CVA.
 * Centraliza todos los estilos visuales de las columnas Kanban.
 */

import { cva } from "class-variance-authority";
import type { OrderStatus } from "../../types";

/**
 * Variantes del contenedor de columna
 * Incluye fondo, ring de drag-over y transiciones
 */
export const columnVariants = cva(
  "flex flex-col rounded-3xl shrink-0 p-4 h-[calc(100vh-200px)] transition-all duration-200",
  {
    variants: {
      status: {
        DRAFT: "bg-gray-50/30",
        CONFIRMED: "bg-blue-50/30",
        PAYMENT_PENDING: "bg-indigo-50/30",
        PAID: "bg-teal-50/30",
        IN_PROGRESS: "bg-purple-50/30",
        READY: "bg-amber-50/30",
        ON_THE_WAY: "bg-cyan-50/30",
        COMPLETED: "bg-emerald-50/30",
        CANCELLED: "bg-pink-50/30",
        ABANDONED: "bg-gray-50/30",
      } as Record<OrderStatus, string>,
    },
    defaultVariants: {
      status: "DRAFT",
    },
  }
);

/**
 * Variantes para el estado de drag-over
 * Se aplica como clase adicional cuando se arrastra sobre la columna
 */
export const columnDragOverVariants = cva("", {
  variants: {
    status: {
      DRAFT: "ring-2 ring-gray-400 ring-offset-2 bg-gray-50/50",
      CONFIRMED: "ring-2 ring-blue-400 ring-offset-2 bg-blue-50/50",
      PAYMENT_PENDING: "ring-2 ring-indigo-400 ring-offset-2 bg-indigo-50/50",
      PAID: "ring-2 ring-teal-400 ring-offset-2 bg-teal-50/50",
      IN_PROGRESS: "ring-2 ring-purple-400 ring-offset-2 bg-purple-50/50",
      READY: "ring-2 ring-amber-400 ring-offset-2 bg-amber-50/50",
      ON_THE_WAY: "ring-2 ring-cyan-400 ring-offset-2 bg-cyan-50/50",
      COMPLETED: "ring-2 ring-emerald-400 ring-offset-2 bg-emerald-50/50",
      CANCELLED: "ring-2 ring-pink-400 ring-offset-2 bg-pink-50/50",
      ABANDONED: "ring-2 ring-gray-400 ring-offset-2 bg-gray-50/50",
    } as Record<OrderStatus, string>,
  },
  defaultVariants: {
    status: "DRAFT",
  },
});

/**
 * Variantes del dot indicador de status
 */
export const dotVariants = cva("w-2 h-2 rounded-full", {
  variants: {
    status: {
      DRAFT: "bg-gray-400",
      CONFIRMED: "bg-blue-400",
      PAYMENT_PENDING: "bg-indigo-400",
      PAID: "bg-teal-400",
      IN_PROGRESS: "bg-purple-400",
      READY: "bg-amber-400",
      ON_THE_WAY: "bg-cyan-400",
      COMPLETED: "bg-emerald-400",
      CANCELLED: "bg-pink-400",
      ABANDONED: "bg-gray-400",
    } as Record<OrderStatus, string>,
  },
  defaultVariants: {
    status: "DRAFT",
  },
});

/**
 * Variantes del header de columna
 */
export const columnHeaderVariants = cva("px-4 py-3 rounded-card-lg mb-3", {
  variants: {
    status: {
      DRAFT: "bg-gray-100",
      CONFIRMED: "bg-blue-100",
      PAYMENT_PENDING: "bg-indigo-100",
      PAID: "bg-teal-100",
      IN_PROGRESS: "bg-purple-100",
      READY: "bg-amber-100",
      ON_THE_WAY: "bg-cyan-100",
      COMPLETED: "bg-emerald-100",
      CANCELLED: "bg-pink-100",
      ABANDONED: "bg-gray-100",
    } as Record<OrderStatus, string>,
  },
  defaultVariants: {
    status: "DRAFT",
  },
});

/**
 * Variantes para el contenedor de tarjetas en estado drag-over
 */
export const cardContainerDragOverVariants = cva("", {
  variants: {
    status: {
      DRAFT: "bg-gray-100/30",
      CONFIRMED: "bg-blue-100/30",
      PAYMENT_PENDING: "bg-indigo-100/30",
      PAID: "bg-teal-100/30",
      IN_PROGRESS: "bg-purple-100/30",
      READY: "bg-amber-100/30",
      ON_THE_WAY: "bg-cyan-100/30",
      COMPLETED: "bg-emerald-100/30",
      CANCELLED: "bg-pink-100/30",
      ABANDONED: "bg-gray-100/30",
    } as Record<OrderStatus, string>,
  },
  defaultVariants: {
    status: "DRAFT",
  },
});

/**
 * Variantes de texto para el contador de órdenes
 */
export const counterTextVariants = cva("text-xs font-medium px-2 py-0.5 rounded-full transition-colors", {
  variants: {
    status: {
      DRAFT: "bg-white/70 text-slate-500",
      CONFIRMED: "bg-white/70 text-slate-500",
      PAYMENT_PENDING: "bg-white/70 text-slate-500",
      PAID: "bg-white/70 text-slate-500",
      IN_PROGRESS: "bg-white/70 text-slate-500",
      READY: "bg-white/70 text-slate-500",
      ON_THE_WAY: "bg-white/70 text-slate-500",
      COMPLETED: "bg-white/70 text-slate-500",
      CANCELLED: "bg-white/70 text-slate-500",
      ABANDONED: "bg-white/70 text-slate-500",
    } as Record<OrderStatus, string>,
  },
  defaultVariants: {
    status: "DRAFT",
  },
});

/**
 * Variantes de texto para el contador en estado drag-over
 */
export const counterTextDragOverVariants = cva("text-xs font-medium px-2 py-0.5 rounded-full transition-colors", {
  variants: {
    status: {
      DRAFT: "bg-gray-100/50 text-gray-600",
      CONFIRMED: "bg-blue-100/50 text-blue-600",
      PAYMENT_PENDING: "bg-indigo-100/50 text-indigo-600",
      PAID: "bg-teal-100/50 text-teal-600",
      IN_PROGRESS: "bg-purple-100/50 text-purple-600",
      READY: "bg-amber-100/50 text-amber-600",
      ON_THE_WAY: "bg-cyan-100/50 text-cyan-600",
      COMPLETED: "bg-emerald-100/50 text-emerald-600",
      CANCELLED: "bg-pink-100/50 text-pink-600",
      ABANDONED: "bg-gray-100/50 text-gray-600",
    } as Record<OrderStatus, string>,
  },
  defaultVariants: {
    status: "DRAFT",
  },
});

/**
 * Variantes para el estado vacío de la columna
 */
export const emptyStateVariants = cva(
  "flex flex-col items-center justify-center py-8 text-center rounded-card transition-colors duration-200 border-2 border-dashed",
  {
    variants: {
      status: {
        DRAFT: "border-gray-200",
        CONFIRMED: "border-blue-200",
        PAYMENT_PENDING: "border-blue-200",
        PAID: "border-purple-200",
        IN_PROGRESS: "border-purple-200",
        READY: "border-orange-200",
        ON_THE_WAY: "border-orange-200",
        COMPLETED: "border-emerald-200",
        CANCELLED: "border-pink-200",
        ABANDONED: "border-gray-200",
      } as Record<OrderStatus, string>,
    },
    defaultVariants: {
      status: "DRAFT",
    },
  }
);

/**
 * Variantes para el estado vacío en drag-over
 */
export const emptyStateDragOverVariants = cva("", {
  variants: {
    status: {
      DRAFT: "border-gray-300 bg-gray-50/50",
      CONFIRMED: "border-blue-300 bg-blue-50/50",
      PAYMENT_PENDING: "border-indigo-300 bg-indigo-50/50",
      PAID: "border-teal-300 bg-teal-50/50",
      IN_PROGRESS: "border-purple-300 bg-purple-50/50",
      READY: "border-amber-300 bg-amber-50/50",
      ON_THE_WAY: "border-cyan-300 bg-cyan-50/50",
      COMPLETED: "border-emerald-300 bg-emerald-50/50",
      CANCELLED: "border-pink-300 bg-pink-50/50",
      ABANDONED: "border-gray-300 bg-gray-50/50",
    } as Record<OrderStatus, string>,
  },
  defaultVariants: {
    status: "DRAFT",
  },
});

/**
 * Variantes para el icono del estado vacío
 */
export const emptyStateIconVariants = cva("w-12 h-12 rounded-card flex items-center justify-center mb-3 transition-colors", {
  variants: {
    status: {
      DRAFT: "bg-gray-100",
      CONFIRMED: "bg-blue-100",
      PAYMENT_PENDING: "bg-indigo-100",
      PAID: "bg-teal-100",
      IN_PROGRESS: "bg-purple-100",
      READY: "bg-amber-100",
      ON_THE_WAY: "bg-cyan-100",
      COMPLETED: "bg-emerald-100",
      CANCELLED: "bg-pink-100",
      ABANDONED: "bg-gray-100",
    } as Record<OrderStatus, string>,
  },
  defaultVariants: {
    status: "DRAFT",
  },
});

/**
 * Variantes para el icono del estado vacío en drag-over
 */
export const emptyStateIconDragOverVariants = cva("", {
  variants: {
    status: {
      DRAFT: "bg-gray-200",
      CONFIRMED: "bg-blue-200",
      PAYMENT_PENDING: "bg-indigo-200",
      PAID: "bg-teal-200",
      IN_PROGRESS: "bg-purple-200",
      READY: "bg-amber-200",
      ON_THE_WAY: "bg-cyan-200",
      COMPLETED: "bg-emerald-200",
      CANCELLED: "bg-pink-200",
      ABANDONED: "bg-gray-200",
    } as Record<OrderStatus, string>,
  },
  defaultVariants: {
    status: "DRAFT",
  },
});

/**
 * Variantes de texto para el estado vacío
 */
export const emptyStateTextVariants = cva("text-sm transition-colors", {
  variants: {
    status: {
      DRAFT: "text-gray-400",
      CONFIRMED: "text-blue-400",
      PAYMENT_PENDING: "text-indigo-400",
      PAID: "text-teal-400",
      IN_PROGRESS: "text-purple-400",
      READY: "text-amber-400",
      ON_THE_WAY: "text-cyan-400",
      COMPLETED: "text-emerald-400",
      CANCELLED: "text-pink-400",
      ABANDONED: "text-gray-400",
    } as Record<OrderStatus, string>,
  },
  defaultVariants: {
    status: "DRAFT",
  },
});

/**
 * Variantes de texto para el estado vacío en drag-over
 */
export const emptyStateTextDragOverVariants = cva("text-sm font-medium transition-colors", {
  variants: {
    status: {
      DRAFT: "text-gray-600",
      CONFIRMED: "text-blue-600",
      PAYMENT_PENDING: "text-indigo-600",
      PAID: "text-teal-600",
      IN_PROGRESS: "text-purple-600",
      READY: "text-amber-600",
      ON_THE_WAY: "text-cyan-600",
      COMPLETED: "text-emerald-600",
      CANCELLED: "text-pink-600",
      ABANDONED: "text-gray-600",
    } as Record<OrderStatus, string>,
  },
  defaultVariants: {
    status: "DRAFT",
  },
});

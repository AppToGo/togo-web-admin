/**
 * Kanban Variants - CVA (Class Variance Authority)
 *
 * Variantes de estilo para el tablero Kanban basado en el diseño:
 * - Fondo gradiente suave (rosa/morado/naranja)
 * - Tarjetas con sombras suaves y bordes redondeados
 * - Badges de categoría con colores pastel
 * - Tipografía limpia y moderna
 */

import { cva, type VariantProps } from "class-variance-authority";

// ============================================================================
// KANBAN CARD VARIANTS
// ============================================================================

export const kanbanCardVariants = cva(
  // Base styles - usando utilidades personalizadas
  "relative bg-white rounded-card p-3 cursor-pointer transition-all duration-200",
  {
    variants: {
      // Elevación/sombra de la tarjeta
      elevation: {
        default: "shadow-card hover:shadow-card-md",
        dragging: "shadow-card-lg scale-[1.02]",
        static: "shadow-none",
      },
      // Borde de la tarjeta
      border: {
        default: "border border-slate-100",
        none: "border-0",
        colored: "border-2",
      },
      // Estado de la tarjeta
      state: {
        default: "",
        selected: "ring-2 ring-indigo-500 ring-offset-2",
        disabled: "opacity-60 cursor-not-allowed",
      },
    },
    defaultVariants: {
      elevation: "default",
      border: "default",
      state: "default",
    },
  }
);

export type KanbanCardVariantProps = VariantProps<typeof kanbanCardVariants>;

// ============================================================================
// CATEGORY BADGE VARIANTS
// ============================================================================

export const categoryBadgeVariants = cva(
  "inline-flex items-center px-2.5 py-1 rounded-full text-xxs font-medium",
  {
    variants: {
      variant: {
        // Colores pastel del diseño
        pink: "bg-pink-100 text-pink-700",
        purple: "bg-purple-100 text-purple-700",
        blue: "bg-blue-100 text-blue-700",
        green: "bg-emerald-100 text-emerald-700",
        orange: "bg-orange-100 text-orange-700",
        amber: "bg-amber-100 text-amber-700",
        cyan: "bg-cyan-100 text-cyan-700",
        indigo: "bg-indigo-100 text-indigo-700",
        slate: "bg-slate-100 text-slate-700",
        // Status específicos para órdenes
        pending: "bg-amber-100 text-amber-700",
        confirmed: "bg-blue-100 text-blue-700",
        preparing: "bg-purple-100 text-purple-700",
        ready: "bg-emerald-100 text-emerald-700",
        delivered: "bg-green-100 text-green-700",
        cancelled: "bg-red-100 text-red-700",
      },
    },
    defaultVariants: {
      variant: "slate",
    },
  }
);

export type CategoryBadgeVariantProps = VariantProps<
  typeof categoryBadgeVariants
>;

// ============================================================================
// KANBAN COLUMN VARIANTS
// ============================================================================

export const kanbanColumnVariants = cva(
  "flex flex-col rounded-3xl shrink-0 p-4",
  {
    variants: {
      // Fondo de la columna
      background: {
        default: "bg-white/40 backdrop-blur-sm",
        solid: "bg-slate-50/80",
        transparent: "bg-transparent",
      },
      // Estilo del header
      headerStyle: {
        default: "bg-white/60",
        colored: "",
        minimal: "bg-transparent",
      },
    },
    defaultVariants: {
      background: "default",
      headerStyle: "default",
    },
  }
);

export type KanbanColumnVariantProps = VariantProps<
  typeof kanbanColumnVariants
>;

// ============================================================================
// COLUMN HEADER COLOR VARIANTS
// ============================================================================

export const columnHeaderColorVariants = cva("px-4 py-3 rounded-card-lg mb-3", {
  variants: {
    color: {
      gray: "bg-gray-100",
      blue: "bg-blue-50",
      purple: "bg-purple-50",
      green: "bg-emerald-50",
      orange: "bg-orange-50",
      pink: "bg-pink-50",
      amber: "bg-amber-50",
      cyan: "bg-cyan-50",
      indigo: "bg-indigo-50",
    },
  },
  defaultVariants: {
    color: "gray",
  },
});

export type ColumnHeaderColorVariantProps = VariantProps<
  typeof columnHeaderColorVariants
>;

// ============================================================================
// PROGRESS BAR VARIANTS
// ============================================================================

export const progressBarVariants = cva(
  "h-1.5 rounded-full overflow-hidden bg-slate-100",
  {
    variants: {
      size: {
        sm: "h-1",
        default: "h-1.5",
        lg: "h-2",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export const progressBarFillVariants = cva(
  "h-full rounded-full transition-all duration-500",
  {
    variants: {
      variant: {
        purple: "bg-purple-500",
        green: "bg-emerald-500",
        blue: "bg-blue-500",
        orange: "bg-orange-500",
        pink: "bg-pink-500",
        amber: "bg-amber-500",
        indigo: "bg-indigo-500",
      },
    },
    defaultVariants: {
      variant: "purple",
    },
  }
);

export type ProgressBarVariantProps = VariantProps<typeof progressBarVariants>;
export type ProgressBarFillVariantProps = VariantProps<
  typeof progressBarFillVariants
>;

// ============================================================================
// SIDEBAR METRICS VARIANTS
// ============================================================================

export const metricsCardVariants = cva(
  "glass rounded-card-lg p-5 border border-white/50",
  {
    variants: {
      variant: {
        default: "",
        gradient:
          "bg-gradient-to-br from-slate-900 to-slate-800 text-white border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type MetricsCardVariantProps = VariantProps<typeof metricsCardVariants>;

// ============================================================================
// ACTIVITY ITEM VARIANTS
// ============================================================================

export const activityIconVariants = cva(
  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
  {
    variants: {
      variant: {
        blue: "bg-blue-100 text-blue-600",
        green: "bg-emerald-100 text-emerald-600",
        orange: "bg-orange-100 text-orange-600",
        purple: "bg-purple-100 text-purple-600",
        pink: "bg-pink-100 text-pink-600",
        red: "bg-red-100 text-red-600",
      },
    },
    defaultVariants: {
      variant: "blue",
    },
  }
);

export type ActivityIconVariantProps = VariantProps<
  typeof activityIconVariants
>;

// ============================================================================
// AVATAR VARIANTS
// ============================================================================

export const avatarVariants = cva(
  "relative inline-block rounded-full ring-2 ring-white",
  {
    variants: {
      size: {
        sm: "w-6 h-6",
        default: "w-8 h-8",
        lg: "w-10 h-10",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export type AvatarVariantProps = VariantProps<typeof avatarVariants>;

// ============================================================================
// PAGE BACKGROUND
// ============================================================================

export const pageBackgroundVariants = cva("min-h-screen", {
  variants: {
    variant: {
      // Gradiente suave como en el diseño (rosa/morado a naranja)
      gradient: "bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50",
      soft: "bg-gradient-to-br from-violet-50 via-fuchsia-50 to-rose-50",
      cool: "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50",
      warm: "bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50",
      plain: "bg-slate-50",
    },
  },
  defaultVariants: {
    variant: "gradient",
  },
});

export type PageBackgroundVariantProps = VariantProps<
  typeof pageBackgroundVariants
>;

// ============================================================================
// MAIN CONTAINER
// ============================================================================

export const mainContainerVariants = cva(
  "rounded-card-xl shadow-glass overflow-hidden",
  {
    variants: {
      variant: {
        default: "glass",
        solid: "bg-white",
        glass: "glass-light",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type MainContainerVariantProps = VariantProps<
  typeof mainContainerVariants
>;

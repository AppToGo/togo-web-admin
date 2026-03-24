/**
 * Metrics CVA Variants
 *
 * Variantes de estilo CVA para el sistema de métricas estandarizado.
 * Usa los tokens como base y proporciona variantes compuestas.
 */

import { cva, type VariantProps } from "class-variance-authority";

// ============================================================================
// METRIC CARD VARIANTS
// ============================================================================

export const metricCardVariants = cva(
  // Base styles
  "relative overflow-hidden",
  {
    variants: {
      colorScheme: {
        indigo: "",
        emerald: "",
        amber: "",
        blue: "",
        purple: "",
        slate: "",
      },
      size: {
        sm: "p-4",
        md: "p-5",
        lg: "p-6",
      },
      isGradient: {
        true: "text-white",
        false: "bg-white",
      },
      showHeaderBorder: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      // Gradient variants
      {
        isGradient: true,
        colorScheme: "indigo",
        class: "bg-gradient-indigo-purple",
      },
      {
        isGradient: true,
        colorScheme: "emerald",
        class: "bg-gradient-emerald-teal",
      },
      {
        isGradient: true,
        colorScheme: "amber",
        class: "bg-gradient-orange-amber",
      },
      {
        isGradient: true,
        colorScheme: "blue",
        class: "bg-gradient-blue-cyan",
      },
      {
        isGradient: true,
        colorScheme: "purple",
        class: "bg-gradient-purple-indigo",
      },
      // Non-gradient variants with header border
      {
        isGradient: false,
        showHeaderBorder: true,
        class: "rounded-card-lg border border-slate-100",
      },
      {
        isGradient: false,
        showHeaderBorder: false,
        class: "rounded-card-lg shadow-card border border-slate-100",
      },
    ],
    defaultVariants: {
      colorScheme: "indigo",
      size: "md",
      isGradient: false,
      showHeaderBorder: false,
    },
  }
);

export type MetricCardVariantProps = VariantProps<typeof metricCardVariants>;

// ============================================================================
// RANKING ITEM VARIANTS
// ============================================================================

export const rankingItemVariants = cva(
  // Base styles
  "flex items-center justify-between rounded-lg transition-colors",
  {
    variants: {
      position: {
        1: "", // Gold
        2: "", // Silver
        3: "", // Bronze
        other: "",
      },
      isClickable: {
        true: "cursor-pointer hover:bg-slate-50",
        false: "",
      },
      size: {
        sm: "p-2",
        md: "p-3",
        lg: "p-4",
      },
    },
    compoundVariants: [
      // Position-based styling for rank badge
      {
        position: 1,
        class: "",
      },
      {
        position: 2,
        class: "",
      },
      {
        position: 3,
        class: "",
      },
    ],
    defaultVariants: {
      position: "other",
      isClickable: false,
      size: "md",
    },
  }
);

export type RankingItemVariantProps = VariantProps<typeof rankingItemVariants>;

// Rank badge variants
export const rankBadgeVariants = cva(
  "flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm shrink-0",
  {
    variants: {
      rank: {
        1: "bg-amber-100 text-amber-700",
        2: "bg-slate-100 text-slate-700",
        3: "bg-orange-100 text-orange-700",
        other: "bg-slate-50 text-slate-600",
      },
    },
    defaultVariants: {
      rank: "other",
    },
  }
);

export type RankBadgeVariantProps = VariantProps<typeof rankBadgeVariants>;

// ============================================================================
// PROGRESS BAR VARIANTS
// ============================================================================

export const progressBarContainerVariants = cva(
  "rounded-full overflow-hidden bg-slate-100",
  {
    variants: {
      size: {
        sm: "h-1",
        md: "h-1.5",
        lg: "h-2",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export const progressBarFillVariants = cva(
  "h-full rounded-full transition-all duration-500",
  {
    variants: {
      color: {
        blue: "bg-blue-500",
        purple: "bg-purple-500",
        amber: "bg-amber-500",
        cyan: "bg-cyan-500",
        emerald: "bg-emerald-500",
      },
    },
    defaultVariants: {
      color: "purple",
    },
  }
);

export type ProgressBarContainerVariantProps = VariantProps<
  typeof progressBarContainerVariants
>;
export type ProgressBarFillVariantProps = VariantProps<
  typeof progressBarFillVariants
>;

// ============================================================================
// METRIC VALUE VARIANTS
// ============================================================================

export const metricValueVariants = cva("font-bold", {
  variants: {
    size: {
      sm: "text-xl",
      md: "text-2xl",
      lg: "text-3xl",
    },
    colorScheme: {
      indigo: "text-indigo-600",
      emerald: "text-emerald-600",
      amber: "text-amber-600",
      blue: "text-blue-600",
      purple: "text-purple-600",
      slate: "text-slate-900",
      white: "text-white",
    },
  },
  defaultVariants: {
    size: "md",
    colorScheme: "slate",
  },
});

export type MetricValueVariantProps = VariantProps<typeof metricValueVariants>;

// ============================================================================
// METRIC ICON CONTAINER VARIANTS
// ============================================================================

export const metricIconContainerVariants = cva(
  "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
  {
    variants: {
      colorScheme: {
        indigo: "bg-indigo-100",
        emerald: "bg-emerald-100",
        amber: "bg-amber-100",
        blue: "bg-blue-100",
        purple: "bg-purple-100",
        slate: "bg-slate-100",
      },
    },
    defaultVariants: {
      colorScheme: "indigo",
    },
  }
);

export type MetricIconContainerVariantProps = VariantProps<
  typeof metricIconContainerVariants
>;

// ============================================================================
// METRIC ICON COLOR VARIANTS
// ============================================================================

export const metricIconColorVariants = cva("h-6 w-6", {
  variants: {
    colorScheme: {
      indigo: "text-indigo-600",
      emerald: "text-emerald-600",
      amber: "text-amber-600",
      blue: "text-blue-600",
      purple: "text-purple-600",
      slate: "text-slate-600",
      white: "text-white",
    },
  },
  defaultVariants: {
    colorScheme: "indigo",
  },
});

export type MetricIconColorVariantProps = VariantProps<
  typeof metricIconColorVariants
>;

// ============================================================================
// HEADER VARIANTS
// ============================================================================

export const metricHeaderVariants = cva(
  "flex items-center justify-between pb-2 border-b",
  {
    variants: {
      variant: {
        default: "border-slate-100",
        light: "border-white/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type MetricHeaderVariantProps = VariantProps<typeof metricHeaderVariants>;

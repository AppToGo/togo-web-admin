/**
 * Metrics Design Tokens
 *
 * Tokens semánticos para el sistema de métricas estandarizado.
 * Basado en variables CSS de globals.css y el patrón visual de OrderMetrics.
 */

// ============================================================================
// COLOR TOKENS
// ============================================================================

export const metricColors = {
  // Esquemas de color para métricas
  indigo: {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    icon: "text-indigo-600",
    fill: "bg-indigo-500",
    gradient: "bg-gradient-indigo-purple",
  },
  emerald: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    icon: "text-emerald-600",
    fill: "bg-emerald-500",
    gradient: "bg-gradient-emerald-teal",
  },
  amber: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    icon: "text-amber-600",
    fill: "bg-amber-500",
    gradient: "bg-gradient-orange-amber",
  },
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    icon: "text-blue-600",
    fill: "bg-blue-500",
    gradient: "bg-gradient-blue-cyan",
  },
  purple: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    icon: "text-purple-600",
    fill: "bg-purple-500",
    gradient: "bg-gradient-purple-indigo",
  },
  slate: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    icon: "text-slate-600",
    fill: "bg-slate-500",
    gradient: "bg-gradient-slate-dark",
  },
  cyan: {
    bg: "bg-cyan-100",
    text: "text-cyan-700",
    icon: "text-cyan-600",
    fill: "bg-cyan-500",
    gradient: "bg-gradient-blue-cyan",
  },
} as const;

// Colores específicos para ranking (medallas)
export const rankingColors = {
  gold: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    icon: "text-amber-500",
    border: "border-amber-200",
  },
  silver: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    icon: "text-slate-400",
    border: "border-slate-200",
  },
  bronze: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    icon: "text-orange-400",
    border: "border-orange-200",
  },
  default: {
    bg: "bg-slate-50",
    text: "text-slate-600",
    icon: "text-slate-400",
    border: "border-slate-100",
  },
} as const;

// ============================================================================
// SPACING TOKENS
// ============================================================================

export const metricSpacing = {
  card: {
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
  },
  gap: {
    sm: "gap-2",
    md: "gap-3",
    lg: "gap-4",
    xl: "gap-6",
  },
  item: {
    sm: "p-2",
    md: "p-3",
    lg: "p-4",
  },
} as const;

// ============================================================================
// RADIUS TOKENS
// ============================================================================

export const metricRadius = {
  sm: "rounded-card-sm", // 8px
  md: "rounded-card",    // 16px
  lg: "rounded-card-lg", // 24px
  xl: "rounded-card-xl", // 32px
  full: "rounded-full",
} as const;

// ============================================================================
// SHADOW TOKENS
// ============================================================================

export const metricShadows = {
  sm: "shadow-card-sm",
  md: "shadow-card",
  lg: "shadow-card-md",
  xl: "shadow-card-lg",
  hover: "shadow-card-hover",
  none: "shadow-none",
} as const;

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

export const metricTypography = {
  title: {
    sm: "text-sm font-medium",
    md: "text-base font-semibold",
    lg: "text-lg font-bold",
  },
  value: {
    sm: "text-xl font-bold",
    md: "text-2xl font-bold",
    lg: "text-3xl font-bold",
  },
  subtitle: {
    sm: "text-xs text-slate-400",
    md: "text-sm text-slate-500",
  },
  label: {
    default: "text-xs font-medium text-slate-500 uppercase tracking-wide",
    muted: "text-xs text-slate-400",
  },
} as const;

// ============================================================================
// PROGRESS BAR TOKENS
// ============================================================================

export const progressBarTokens = {
  height: {
    sm: "h-1",
    md: "h-1.5",
    lg: "h-2",
  },
  colors: {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    amber: "bg-amber-500",
    cyan: "bg-cyan-500",
    emerald: "bg-emerald-500",
  },
} as const;

// ============================================================================
// TRANSITION TOKENS
// ============================================================================

export const metricTransitions = {
  default: "transition-all duration-200",
  fast: "transition-all duration-150",
  slow: "transition-all duration-300",
  colors: "transition-colors duration-200",
  transform: "transition-transform duration-200",
} as const;

// ============================================================================
// HEADER TOKENS
// ============================================================================

export const headerTokens = {
  default: "flex items-center justify-between pb-2 border-b border-slate-100",
  title: "text-xs font-medium text-slate-500 uppercase tracking-wide",
  count: "text-xs text-slate-500",
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type MetricColorScheme = keyof typeof metricColors;
export type RankingColor = keyof typeof rankingColors;
export type MetricSize = "sm" | "md" | "lg";

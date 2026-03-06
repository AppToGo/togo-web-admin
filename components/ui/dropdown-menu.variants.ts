"use client"

import { cva } from "class-variance-authority"

/**
 * Dropdown Menu Variants
 * 
 * Variantes de estilo para el dropdown menu siguiendo el diseño del proyecto:
 * - Bordes redondeados (rounded-card)
 * - Sombras suaves (shadow-card)
 * - Paleta pastel para items
 */

export const dropdownContentVariants = cva(
  "z-50 min-w-[8rem] overflow-hidden border bg-popover text-popover-foreground shadow-card-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  {
    variants: {
      variant: {
        default: "rounded-card border-slate-100 p-1.5",
        glass: "rounded-card-xl border-white/40 p-2 glass-strong",
        minimal: "rounded-lg border-slate-100/50 p-1",
      },
      size: {
        default: "min-w-[8rem]",
        sm: "min-w-[6rem]",
        lg: "min-w-[12rem]",
        full: "min-w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export const dropdownItemVariants = cva(
  "relative flex cursor-pointer select-none items-center rounded-card px-3 py-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  {
    variants: {
      variant: {
        default: "focus:bg-slate-50 focus:text-slate-900",
        accent: "text-indigo-700 focus:bg-indigo-50 focus:text-indigo-800",
        destructive: "text-red-600 focus:bg-red-50 focus:text-red-700",
        success: "text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700",
        warning: "text-amber-600 focus:bg-amber-50 focus:text-amber-700",
      },
      state: {
        default: "",
        active: "bg-slate-100 text-slate-900",
      },
    },
    defaultVariants: {
      variant: "default",
      state: "default",
    },
  }
)

export const dropdownSeparatorVariants = cva(
  "-mx-1 my-1 h-px",
  {
    variants: {
      variant: {
        default: "bg-slate-100",
        subtle: "bg-slate-50",
        accent: "bg-indigo-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export const dropdownLabelVariants = cva(
  "px-3 py-2 text-xs font-semibold text-slate-500",
  {
    variants: {
      variant: {
        default: "",
        accent: "text-indigo-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export const dropdownShortcutVariants = cva(
  "ml-auto text-xs tracking-widest opacity-60",
  {
    variants: {
      variant: {
        default: "text-slate-400",
        accent: "text-indigo-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

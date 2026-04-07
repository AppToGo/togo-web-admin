"use client";

/**
 * Alert Badge Component
 * Displays a badge with alert count
 */

import { cn } from "@/lib/utils";

interface AlertBadgeProps {
  count: number;
  label: string;
  variant?: "default" | "destructive" | "warning";
  className?: string;
}

export function AlertBadge({
  count,
  label,
  variant = "default",
  className,
}: AlertBadgeProps) {
  const variantClasses = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    destructive: "bg-red-100 text-red-700 border-red-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium",
        variantClasses[variant],
        className
      )}
    >
      <span className="flex items-center justify-center min-w-5 h-5 bg-white rounded-full text-xs font-bold shadow-sm">
        {count > 99 ? "99+" : count}
      </span>
      <span>{label}</span>
    </div>
  );
}

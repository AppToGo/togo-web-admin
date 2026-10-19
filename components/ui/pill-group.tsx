"use client";

/**
 * Filtros en pastillas con scroll horizontal (teléfono): uno activo a la
 * vez, con contador opcional. Como `tablist` (bandejas) o como grupo de
 * botones (filtros).
 */

import { cn } from "@/lib/utils";

export interface PillOption<T extends string> {
  id: T;
  label: string;
  count?: number;
  /** Punto de color antes del texto (ej. estado del stock). */
  dotClassName?: string;
}

interface PillGroupProps<T extends string> {
  label: string;
  options: PillOption<T>[];
  /** `null`: ninguna elegida (filtro que se puede desmarcar). */
  value: T | null;
  onChange: (value: T) => void;
  /** `tabs`: role="tablist" + aria-selected; `filter`: aria-pressed. */
  variant?: "tabs" | "filter";
  /**
   * `solid`: la del teléfono (activa en slate). `glass`: sobre el fondo
   * degradado del escritorio (activa en índigo, el resto translúcidas).
   */
  appearance?: "solid" | "glass";
  className?: string;
}

export function PillGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  variant = "filter",
  appearance = "solid",
  className,
}: PillGroupProps<T>) {
  const isTabs = variant === "tabs";

  return (
    <div
      role={isTabs ? "tablist" : "group"}
      aria-label={label}
      className={cn("flex gap-1.5 overflow-x-auto [scrollbar-width:none]", className)}
    >
      {options.map((option) => {
        const on = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role={isTabs ? "tab" : undefined}
            aria-selected={isTabs ? on : undefined}
            aria-pressed={isTabs ? undefined : on}
            onClick={() => onChange(option.id)}
            className={cn(
              "flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-colors",
              appearance === "glass"
                ? on
                  ? "bg-indigo-600 text-white"
                  : "bg-white/75 text-slate-600 hover:bg-white hover:text-slate-900"
                : on
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700"
            )}
          >
            {option.dotClassName && (
              <span aria-hidden className={cn("h-2 w-2 rounded-full", option.dotClassName)} />
            )}
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn(
                  "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs tabular-nums",
                  on ? "bg-white text-slate-900" : "bg-slate-200 text-slate-700"
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Selector segmentado de ancho completo (Todos · Activos · Inactivos). */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  variant = "filter",
  className,
}: PillGroupProps<T>) {
  const isTabs = variant === "tabs";

  return (
    <div
      role={isTabs ? "tablist" : "group"}
      aria-label={label}
      className={cn("grid gap-1 rounded-xl bg-slate-200/70 p-1", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const on = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role={isTabs ? "tab" : undefined}
            aria-selected={isTabs ? on : undefined}
            aria-pressed={isTabs ? undefined : on}
            onClick={() => onChange(option.id)}
            className={cn(
              "h-9 rounded-[9px] text-sm font-semibold transition-colors",
              on ? "bg-white text-indigo-700 shadow-card-sm" : "text-slate-600"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

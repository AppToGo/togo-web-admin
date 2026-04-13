import * as React from "react";
import { useId } from "react";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const inputVariants = cva(
  "flex h-11 w-full px-3 py-1 text-sm text-slate-700 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "rounded-md border border-slate-200 bg-white",
        ghost: "rounded-lg border-0 bg-transparent shadow-none",
        outline:
          "rounded-lg border border-slate-200 bg-transparent shadow-none",
        elevated: "rounded-lg border border-slate-200 bg-white shadow-md",
        primary:
          "rounded-lg border border-indigo-200 bg-white shadow-sm ring-1 ring-indigo-100",
        kanban: "rounded-xl border bg-card text-card-foreground shadow",
        error:
          "rounded-md border border-red-300 bg-white shadow-sm focus-visible:ring-red-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface InputProps
  extends React.ComponentProps<"input">, VariantProps<typeof inputVariants> {
  label?: string;
  helperText?: string;
  error?: string;
  prefix?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, helperText, error, variant, prefix, id: providedId, ...props }, ref) => {
    const generatedId = useId();
    const inputId = providedId || generatedId;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const ariaDescribedBy = errorId || helperId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        {prefix ? (
          <div className={cn(
            "flex h-11 w-full text-sm transition-colors",
            "rounded-md border border-slate-200 bg-white",
            error && "border-red-300 ring-1 ring-red-300",
            "focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20",
            props.disabled && "cursor-not-allowed opacity-50",
          )}>
            <span className="flex items-center px-3 text-slate-500 border-r border-slate-200 bg-slate-50 rounded-l-md select-none text-sm font-medium">
              {prefix}
            </span>
            <input
              id={inputId}
              type={type}
              className={cn(
                "flex-1 px-3 py-1 text-sm text-slate-700 bg-transparent placeholder:text-slate-400 focus-visible:outline-none disabled:cursor-not-allowed",
                className
              )}
              ref={ref}
              aria-invalid={!!error}
              aria-describedby={ariaDescribedBy}
              {...props}
            />
          </div>
        ) : (
          <input
            id={inputId}
            type={type}
            className={cn(
              inputVariants({ variant: error ? "error" : variant }),
              className
            )}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={ariaDescribedBy}
            {...props}
          />
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1 text-xs text-slate-500">{helperText}</p>
        )}
        {error && (
          <p id={errorId} className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };

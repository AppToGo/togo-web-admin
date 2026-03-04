"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {label}
            {props.required && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex w-full rounded-xl border-2 bg-white px-4 py-3.5 text-base text-slate-900 transition-all duration-200",
            "placeholder:text-slate-400",
            "focus:outline-none focus:ring-4",
            "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
            error 
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" 
              : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-500 mt-2">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-slate-500 mt-2">{helperText}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };

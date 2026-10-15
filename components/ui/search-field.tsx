"use client";

/**
 * Buscador de las listas del teléfono: campo grande con la lupa adentro.
 */

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

export function SearchField({ value, onChange, placeholder, className }: SearchFieldProps) {
  return (
    <label className={cn("relative block", className)}>
      <Search
        aria-hidden
        className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-[42px] pr-3.5 text-[15px] text-slate-900 outline-none focus:border-indigo-400"
      />
    </label>
  );
}

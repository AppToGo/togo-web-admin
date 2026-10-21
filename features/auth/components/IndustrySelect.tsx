"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { fetchIndustries } from "@/features/auth/services/auth.service";

const SELECT_CLASS =
  "w-full h-11 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";

interface IndustrySelectProps {
  id: string;
  label: string;
  /** Para formularios con FormData; el valor es el nombre de la industria. */
  name?: string;
  /** Controlado. */
  value?: string;
  onChange?: (value: string) => void;
  /** No controlado. */
  defaultValue?: string;
  disabled?: boolean;
  helperText?: string;
}

/**
 * Tipo de negocio: las industrias de `/industries`, las mismas del
 * registro y del login demo. Si el valor actual no está en la lista (dato
 * viejo escrito a mano), se muestra igual para no perderlo al guardar.
 */
export function IndustrySelect({
  id,
  label,
  name,
  value,
  onChange,
  defaultValue = "",
  disabled,
  helperText,
}: IndustrySelectProps) {
  const tRegister = useTranslations("auth.register");
  const { data: industries = [] } = useQuery({
    queryKey: ["industries"],
    queryFn: fetchIndustries,
    staleTime: 60 * 60 * 1000,
  });
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const missing =
    current !== "" && !industries.some((ind) => ind.name === current);

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      <select
        id={id}
        name={name}
        value={current}
        onChange={(e) => {
          setInner(e.target.value);
          onChange?.(e.target.value);
        }}
        disabled={disabled}
        className={cn(SELECT_CLASS)}
      >
        <option value="">{tRegister("industry.placeholder")}</option>
        {missing && <option value={current}>{current}</option>}
        {industries.map((ind) => (
          <option key={ind.id} value={ind.name}>
            {ind.name}
          </option>
        ))}
      </select>
      {helperText && (
        <p className="mt-1 text-xs text-slate-400">{helperText}</p>
      )}
    </div>
  );
}

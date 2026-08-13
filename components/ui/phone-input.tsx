"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface CountryOption {
  code: string; // "+57"
  iso: string; // "CO"
  name: string;
  flag: string;
  placeholder: string;
}

export const PHONE_COUNTRIES: CountryOption[] = [
  { code: "+57", iso: "CO", name: "Colombia", flag: "🇨🇴", placeholder: "300 123 4567" },
  { code: "+1", iso: "US", name: "Estados Unidos", flag: "🇺🇸", placeholder: "300 123 4567" },
];

export function parsePhoneValue(value: string): { countryCode: string; nationalNumber: string } {
  const raw = (value || "").trim().replace(/\s|-/g, "");
  if (!raw) return { countryCode: "+57", nationalNumber: "" };
  // Si ya viene con +, extraer indicativo
  for (const c of PHONE_COUNTRIES) {
    if (raw.startsWith(c.code)) {
      return { countryCode: c.code, nationalNumber: raw.slice(c.code.length).replace(/\D/g, "") };
    }
    // Sin + pero con indicativo sin + (573...)
    const withoutPlus = c.code.replace("+", "");
    if (raw.startsWith(withoutPlus)) {
      return { countryCode: c.code, nationalNumber: raw.slice(withoutPlus.length).replace(/\D/g, "") };
    }
  }
  // Fallback: si empieza con +1/+57 genérico
  if (raw.startsWith("+1")) return { countryCode: "+1", nationalNumber: raw.slice(2).replace(/\D/g, "") };
  if (raw.startsWith("+57")) return { countryCode: "+57", nationalNumber: raw.slice(3).replace(/\D/g, "") };
  // Sin indicativo, asumir +57
  return { countryCode: "+57", nationalNumber: raw.replace(/\D/g, "") };
}

export function formatE164(countryCode: string, nationalNumber: string): string {
  const digits = nationalNumber.replace(/\D/g, "");
  if (!digits) return "";
  return `${countryCode}${digits}`;
}

export interface PhoneInputProps {
  value: string; // E.164 completo "+573001234567" o ""
  onChange: (value: string) => void;
  onBlur?: () => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  id?: string;
  required?: boolean;
  helperText?: string;
}

export function PhoneInput({
  value,
  onChange,
  onBlur,
  label,
  disabled,
  error,
  id,
  required,
  helperText,
}: PhoneInputProps) {
  const { countryCode, nationalNumber } = React.useMemo(() => parsePhoneValue(value), [value]);
  const [localCode, setLocalCode] = React.useState(countryCode);
  const [localNumber, setLocalNumber] = React.useState(nationalNumber);

  React.useEffect(() => {
    setLocalCode(countryCode);
    setLocalNumber(nationalNumber);
  }, [countryCode, nationalNumber]);

  const handleCodeChange = (code: string) => {
    setLocalCode(code);
    const next = formatE164(code, localNumber);
    onChange(next);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setLocalNumber(digits);
    const next = formatE164(localCode, digits);
    onChange(next);
  };

  const inputId = id || "phone-input";

  return (
    <div className="space-y-2 w-full">
      {label && (
        <Label htmlFor={inputId}>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="flex gap-2">
        <Select value={localCode} onValueChange={handleCodeChange} disabled={disabled}>
          <SelectTrigger className="w-[130px] shrink-0" aria-label="Indicativo país">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PHONE_COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                <span className="flex items-center gap-2">
                  <span>{c.flag}</span>
                  <span>{c.code}</span>
                  <span className="text-xs text-slate-500 hidden sm:inline">{c.iso}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id={inputId}
          value={localNumber}
          onChange={handleNumberChange}
          onBlur={onBlur}
          placeholder={PHONE_COUNTRIES.find((c) => c.code === localCode)?.placeholder ?? "300 123 4567"}
          disabled={disabled}
          error={error}
          inputMode="numeric"
          autoComplete="tel"
          className={cn("flex-1")}
        />
      </div>
      {helperText && !error && <p className="text-xs text-slate-500">{helperText}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

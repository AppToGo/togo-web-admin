"use client";
/**
 * Input numérico de COP: solo dígitos, muestra formato es-CO mientras se
 * escribe. El valor real (number, sin formato) sale por `onChange`.
 */
import { Input } from "@/components/ui/input";
import { parseCOPInput } from "../utils/cash.utils";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  min?: number;
}

export function CurrencyInput({
  value,
  onChange,
  placeholder,
  disabled,
  id,
  min = 0,
}: CurrencyInputProps) {
  const display =
    value > 0
      ? new Intl.NumberFormat("es-CO").format(value)
      : "";

  return (
    <Input
      id={id}
      inputMode="numeric"
      value={display}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(event) => {
        const parsed = parseCOPInput(event.target.value);
        onChange(Math.max(min, parsed));
      }}
    />
  );
}

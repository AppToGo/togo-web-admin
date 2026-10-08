"use client";
/**
 * Input numérico de COP: solo dígitos, muestra formato es-CO mientras se
 * escribe. El valor real (number, sin formato) sale por `onChange`; campo
 * vacío = 0.
 *
 * No recorta a un mínimo: con un mínimo de 1 el campo no se podía vaciar
 * (al borrar quedaba "1" y escribir 2000 daba 12.000). Los mínimos los
 * valida quien usa el input, antes de habilitar su botón.
 */
import { Input } from "@/components/ui/input";
import { parseCOPInput } from "../utils/cash.utils";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

export function CurrencyInput({
  value,
  onChange,
  placeholder,
  disabled,
  id,
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
      onChange={(event) => onChange(parseCOPInput(event.target.value))}
    />
  );
}

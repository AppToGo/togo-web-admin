"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { CurrencyInput } from "@/features/cash/components/CurrencyInput";
import { formatCOP } from "@/features/cash/utils/cash.utils";
import type { TipConfig } from "@/features/branches/types";
import { tipAmount, type TipChoice } from "../utils/tip.utils";

interface TipSelectorProps {
  config: TipConfig;
  subtotal: number;
  value: TipChoice;
  onChange: (value: TipChoice) => void;
  id?: string;
  /** Sin título propio: cuando lo pone el contenedor (ej. `FieldGroup`). */
  hideLabel?: boolean;
}

const CUSTOM = "custom";

/**
 * Propina voluntaria al cobrar (mesa y mostrador): los % de la sede,
 * "Sin propina" y un monto libre. Mismos botones que el método de pago de
 * los drawers de cobro. Muestra el valor en pesos.
 */
export function TipSelector({
  config,
  subtotal,
  value,
  onChange,
  id = "tip",
  hideLabel = false,
}: TipSelectorProps) {
  const t = useTranslations("orders.tip");
  const isCustom = "amount" in value;
  const amount = tipAmount(value, subtotal);
  const selected = isCustom ? CUSTOM : String(value.percent);

  const options = [
    ...config.presets.map((p) => ({
      id: String(p),
      label: p === 0 ? t("none") : `${p} %`,
    })),
    { id: CUSTOM, label: t("custom") },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        {!hideLabel && <p className="text-sm font-medium">{t("label")}</p>}
        <span className="ml-auto text-sm font-semibold tabular-nums">{formatCOP(amount)}</span>
      </div>
      <div role="group" aria-label={t("label")} className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected === option.id}
            onClick={() =>
              onChange(option.id === CUSTOM ? { amount } : { percent: Number(option.id) })
            }
            className={cn(
              "rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors",
              selected === option.id
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {isCustom && (
        <CurrencyInput
          id={`${id}-amount`}
          value={value.amount}
          onChange={(next) => onChange({ amount: next })}
          placeholder="0"
        />
      )}
      <p className="text-xs text-slate-500">{t("voluntary")}</p>
    </div>
  );
}

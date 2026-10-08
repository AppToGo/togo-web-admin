/**
 * Utilidades de caja del admin.
 * El formateo es solo presentación: el dinero siempre se calcula en el
 * servidor con `Decimal` (docs/caja-pedidos.md).
 */
import { COP_BILLS, COP_COINS } from "../types/cash.types";

export function formatCOP(value: string | number | null | undefined): string {
  const amount = typeof value === "string" ? Number(value) : (value ?? 0);
  if (!Number.isFinite(amount)) return "$ 0";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Denominaciones COP de mayor a menor (billetes + monedas). */
export const COP_DENOMINATIONS: number[] = [...COP_BILLS, ...COP_COINS];

export function sumDenominations(counts: Record<string, number>): number {
  return Object.entries(counts).reduce((acc, [denomination, count]) => {
    const value = Number(denomination);
    const qty = Number(count);
    if (!Number.isFinite(value) || !Number.isFinite(qty) || qty < 0) return acc;
    return acc + value * Math.floor(qty);
  }, 0);
}

export function parseCOPInput(raw: string): number {
  const digits = raw.replace(/[^0-9]/g, "");
  return digits ? Number(digits) : 0;
}

export function differenceTone(difference: string | number | null | undefined): {
  tone: "exact" | "shortage" | "surplus";
  value: number;
} {
  const value = typeof difference === "string" ? Number(difference) : (difference ?? 0);
  if (!Number.isFinite(value) || value === 0) return { tone: "exact", value: 0 };
  return value < 0 ? { tone: "shortage", value } : { tone: "surplus", value };
}

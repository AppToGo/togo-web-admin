"use client";

/**
 * Fila de producto para armar un pedido: foto o inicial, nombre,
 * "categoría · precio" y botón + que pasa a − cantidad +. La usan el drawer
 * de Nuevo pedido y la vista de lista de Caja · Vender (docs/caja-pos.md).
 */

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InventoryItem } from "@/features/branch-inventory/types";
import { formatCurrency } from "../utils/order-status.utils";

/** Mismo tope por línea que el carrito de WhatsApp. */
export const MAX_QUANTITY = 99;

export function productLabel(item: InventoryItem): string {
  return item.variantLabel && item.variantLabel !== item.productName
    ? `${item.productName} · ${item.variantLabel}`
    : item.productName;
}

/** Cantidad máxima de una línea: el tope del carrito o el stock. */
export function maxQuantity(item: InventoryItem): number {
  return Math.min(MAX_QUANTITY, item.stock ?? MAX_QUANTITY);
}

export function ProductRow({
  item,
  quantity,
  onChange,
  addLabel,
  removeLabel,
}: {
  item: InventoryItem;
  quantity: number;
  onChange: (quantity: number) => void;
  addLabel: string;
  removeLabel: string;
}) {
  const name = productLabel(item);
  const maxReached = quantity >= maxQuantity(item);

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-card transition-colors",
        quantity > 0 ? "bg-indigo-50/60" : "hover:bg-slate-50"
      )}
    >
      {item.productImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.productImage}
          alt=""
          className="w-12 h-12 rounded-icon object-cover shrink-0 bg-slate-100"
        />
      ) : (
        <div className="w-12 h-12 rounded-icon bg-slate-100 text-slate-400 font-semibold flex items-center justify-center shrink-0">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">
          {name}
          {item.internalSku && (
            <span className="ml-1.5 rounded bg-slate-100 px-1 py-px font-mono text-[10px] font-medium text-slate-500 border border-slate-200 align-middle">
              {item.internalSku}
            </span>
          )}
        </p>
        <p className="text-xs text-slate-500 truncate">
          {[item.categoryName, formatCurrency(item.effectivePrice)].filter(Boolean).join(" · ")}
        </p>
      </div>
      {quantity > 0 ? (
        <QuantityStepper
          name={name}
          quantity={quantity}
          onChange={onChange}
          maxReached={maxReached}
          addLabel={addLabel}
          removeLabel={removeLabel}
        />
      ) : (
        <button
          type="button"
          onClick={() => onChange(1)}
          aria-label={`${addLabel} ${name}`}
          className="w-9 h-9 rounded-icon bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center justify-center shrink-0"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/** − cantidad + en índigo (fila de producto y líneas de la venta). */
export function QuantityStepper({
  name,
  quantity,
  onChange,
  maxReached,
  addLabel,
  removeLabel,
  size = "md",
  className,
}: {
  name: string;
  quantity: number;
  onChange: (quantity: number) => void;
  maxReached: boolean;
  addLabel: string;
  removeLabel: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const button = size === "sm" ? "w-8 h-8" : "w-9 h-9";
  return (
    <div
      className={cn("flex items-center rounded-icon bg-indigo-600 text-white shrink-0", className)}
    >
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        aria-label={`${removeLabel} ${name}`}
        className={cn(button, "flex items-center justify-center hover:bg-indigo-700 rounded-l-icon")}
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="w-7 text-center text-sm font-semibold tabular-nums">{quantity}</span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        disabled={maxReached}
        aria-label={`${addLabel} ${name}`}
        className={cn(
          button,
          "flex items-center justify-center hover:bg-indigo-700 rounded-r-icon disabled:opacity-50"
        )}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

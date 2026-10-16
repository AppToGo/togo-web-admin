"use client";

import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { cn, formatCurrency } from "@/lib/utils";
import type { InventoryItem } from "../types";

/** Debajo de este stock el producto se marca como "stock bajo". */
export const LOW_STOCK_THRESHOLD = 10;

export type StockState = "untracked" | "out" | "low" | "in";

export function stockState(stock: number | null): StockState {
  if (stock === null) return "untracked";
  if (stock === 0) return "out";
  if (stock < LOW_STOCK_THRESHOLD) return "low";
  return "in";
}

const STATE_TAG: Record<StockState | "off", string> = {
  in: "bg-emerald-100 text-emerald-800",
  low: "bg-amber-100 text-amber-800",
  out: "bg-red-100 text-red-800",
  untracked: "bg-slate-100 text-slate-600",
  off: "bg-slate-200 text-slate-700",
};

/** Borde del input de stock según el estado (agotado en rojo, bajo en ámbar). */
const STOCK_RING: Partial<Record<StockState, string>> = {
  low: "ring-1 ring-amber-300",
  out: "ring-1 ring-red-300",
};

const FIELD =
  "h-11 w-full rounded-[14px] border-0 bg-white px-3 text-[15px] font-semibold tabular-nums text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-200 disabled:bg-white/60 disabled:text-slate-400";

interface InventoryCardProps {
  item: InventoryItem;
  isSelected: boolean;
  onToggleSelection: () => void;
  onToggleAvailability: (isAvailable: boolean) => void;
  /** Valor en edición (todavía sin guardar) o undefined para usar el del servidor. */
  stockDraft: string | undefined;
  priceDraft: string | undefined;
  onStockChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  readOnly: boolean;
  canSetAvailability: boolean;
  showProductImage: boolean;
}

/**
 * Producto en la sede: disponibilidad, stock y precio de la sede editables
 * en la misma tarjeta (antes, una fila de 9 columnas).
 */
export function InventoryCard({
  item,
  isSelected,
  onToggleSelection,
  onToggleAvailability,
  stockDraft,
  priceDraft,
  onStockChange,
  onPriceChange,
  readOnly,
  canSetAvailability,
  showProductImage,
}: InventoryCardProps) {
  const t = useTranslations("inventory");
  const name = item.variantLabel
    ? `${item.productName} · ${item.variantLabel}`
    : item.productName;
  const state = stockState(item.stock);
  const category = [item.industryCategoryName, item.categoryName]
    .filter(Boolean)
    .join(" › ");
  const hasOverride =
    item.priceOverride !== null && item.priceOverride !== item.basePrice;
  const editingDisabled = readOnly || !item.isAvailable;

  const tag = !item.isAvailable
    ? { key: "off" as const, label: t("card.unavailable") }
    : state === "untracked"
      ? { key: state, label: t("card.untracked") }
      : state === "out"
        ? { key: state, label: t("table.outOfStock") }
        : state === "low"
          ? { key: state, label: t("card.lowStock", { count: item.stock ?? 0 }) }
          : { key: state, label: t("card.inStock") };

  return (
    <li
      className={cn(
        "flex flex-col gap-3.5 rounded-3xl border p-[18px] transition-colors",
        isSelected
          ? "border-indigo-300 bg-white ring-2 ring-indigo-200"
          : "border-white/90 bg-white/65",
        !item.isAvailable && !isSelected && "opacity-80"
      )}
    >
      <div className="flex items-start gap-3">
        {!readOnly && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelection}
            aria-label={t("card.select", { name })}
            className="mt-0.5"
          />
        )}
        {showProductImage && item.productImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.productImage}
            alt=""
            className="h-12 w-12 shrink-0 rounded-xl object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-[15px] font-semibold",
              item.isAvailable ? "text-slate-900" : "text-slate-600"
            )}
          >
            {name}
          </p>
          {category && <p className="truncate text-xs text-slate-500">{category}</p>}
        </div>
        <Switch
          checked={item.isAvailable}
          onCheckedChange={onToggleAvailability}
          disabled={readOnly || !canSetAvailability}
          aria-label={t("card.availableFor", { name })}
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">
          {t("table.stock")}
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={t("card.untrackedPlaceholder")}
            value={stockDraft ?? (item.stock === null ? "" : String(item.stock))}
            onChange={(event) => onStockChange(event.target.value)}
            disabled={editingDisabled}
            className={cn(FIELD, item.isAvailable && STOCK_RING[state])}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">
          {t("card.branchPrice")}
          <input
            type="number"
            inputMode="decimal"
            min={0.01}
            step={0.01}
            placeholder={t("card.basePricePlaceholder", {
              price: formatCurrency(item.basePrice),
            })}
            value={
              priceDraft ??
              (item.priceOverride === null ? "" : String(item.priceOverride))
            }
            onChange={(event) => onPriceChange(event.target.value)}
            disabled={editingDisabled}
            className={FIELD}
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
            STATE_TAG[tag.key]
          )}
        >
          {tag.label}
        </span>
        <span className="text-xs text-slate-500">
          {hasOverride
            ? t("card.basePrice", { price: formatCurrency(item.basePrice) })
            : t("card.usesBasePrice")}
        </span>
      </div>
    </li>
  );
}

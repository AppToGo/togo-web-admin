"use client";

/**
 * Editar un producto en la sede desde el teléfono (diseño móvil): si se
 * ofrece en el menú de la sede, su stock (o "sin control") y su precio en
 * la sede (vacío = el precio base). Se monta con `key` por producto, así el
 * borrador arranca siempre de lo guardado.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Switch } from "@/components/ui/switch";
import { cn, formatCurrency } from "@/lib/utils";
import type { InventoryItem } from "../types";

export interface InventoryItemValues {
  isAvailable: boolean;
  /** `null`: sin control de stock. */
  stock: number | null;
  /** `null`: el precio base del producto. */
  priceOverride: number | null;
}

interface InventoryItemSheetProps {
  item: InventoryItem;
  title: string;
  canSetAvailability: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (values: InventoryItemValues) => void;
}

export function InventoryItemSheet({
  item,
  title,
  canSetAvailability,
  isSaving,
  onClose,
  onSave,
}: InventoryItemSheetProps) {
  const t = useTranslations("inventory");
  const [isAvailable, setIsAvailable] = useState(item.isAvailable || !item.isActivated);
  const [untracked, setUntracked] = useState(item.stock === null);
  const [stock, setStock] = useState(item.stock ?? 0);
  const [price, setPrice] = useState(item.priceOverride === null ? "" : String(item.priceOverride));

  const parsedPrice = price.trim() === "" ? null : Number(price);
  const priceInvalid = parsedPrice !== null && (!Number.isFinite(parsedPrice) || parsedPrice <= 0);

  const save = () => {
    if (priceInvalid) return;
    onSave({
      isAvailable,
      stock: untracked ? null : stock,
      // Igual al base: se guarda como "sin precio propio".
      priceOverride: parsedPrice === item.basePrice ? null : parsedPrice,
    });
  };

  return (
    <BottomSheet open onOpenChange={(open) => !open && onClose()} title={title} variant="form">
      <div className="flex flex-col gap-4 px-1 pb-1" data-testid="inventory-item-sheet">
        <div>
          <p className="text-[17px] font-bold text-slate-900">{title}</p>
          {!item.isActivated && (
            <p className="mt-0.5 text-xs text-amber-700">{t("mobile.notActivated")}</p>
          )}
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5">
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-[15px] font-semibold text-slate-900">{t("mobile.availableHere")}</span>
            <span className="text-xs text-slate-500">
              {canSetAvailability ? t("mobile.availableHint") : t("mobile.availableNoPermission")}
            </span>
          </span>
          <Switch
            checked={isAvailable}
            onCheckedChange={setIsAvailable}
            disabled={!canSetAvailability}
            aria-label={t("mobile.availableHere")}
          />
        </div>

        <div className="flex flex-col gap-2.5 rounded-2xl bg-slate-50 p-3.5">
          <span className="text-[15px] font-semibold text-slate-900">{t("table.stock")}</span>
          <div className={cn("flex items-center gap-3", untracked && "opacity-45")}>
            <button
              type="button"
              disabled={untracked || stock <= 0}
              onClick={() => setStock(Math.max(0, stock - 1))}
              aria-label={t("mobile.stockMinus")}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 disabled:opacity-50"
            >
              <Minus className="h-5 w-5" />
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={untracked ? "" : stock}
              disabled={untracked}
              onChange={(e) => {
                const next = parseInt(e.target.value, 10);
                setStock(Number.isNaN(next) ? 0 : Math.max(0, next));
              }}
              aria-label={t("table.stock")}
              className="h-11 w-20 rounded-xl border border-slate-200 bg-white text-center text-lg font-bold tabular-nums text-slate-900 outline-none focus:border-indigo-400"
            />
            <button
              type="button"
              disabled={untracked}
              onClick={() => setStock(stock + 1)}
              aria-label={t("mobile.stockPlus")}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 disabled:opacity-50"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={untracked}
              onChange={(e) => setUntracked(e.target.checked)}
              className="h-4 w-4 accent-indigo-600"
            />
            {t("mobile.untrackedOption")}
          </label>
        </div>

        <label className="flex flex-col gap-1.5 rounded-2xl bg-slate-50 p-3.5">
          <span className="text-[15px] font-semibold text-slate-900">{t("mobile.priceHere")}</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={String(item.basePrice)}
            aria-invalid={priceInvalid}
            className={cn(
              "h-11 rounded-xl border bg-white px-3 text-[15px] tabular-nums text-slate-900 outline-none",
              priceInvalid ? "border-red-400" : "border-slate-200 focus:border-indigo-400"
            )}
          />
          <span className="text-xs text-slate-500">
            {t("mobile.priceHint", { price: formatCurrency(item.basePrice) })}
          </span>
        </label>

        <button
          type="button"
          onClick={save}
          disabled={isSaving || priceInvalid}
          className="h-[52px] rounded-[14px] bg-indigo-600 text-base font-bold text-white disabled:opacity-60"
        >
          {isSaving
            ? t("mobile.saving")
            : item.isActivated
              ? t("mobile.save")
              : t("mobile.activateAndSave")}
        </button>
      </div>
    </BottomSheet>
  );
}

"use client";

/**
 * Inventario por sede en el teléfono (< md), según el diseño móvil: sede,
 * buscador, filtros por estado del stock con su contador y filas con el
 * stock, el precio de la sede (y el base tachado si cambia) y el
 * interruptor de disponible. Tocar una fila abre la hoja para editar
 * stock, precio y disponibilidad (`InventoryItemSheet`).
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { PillGroup } from "@/components/ui/pill-group";
import { BranchSingleSelector } from "@/features/branches/components";
import { CatalogMobileNav } from "@/features/catalog/components/mobile/CatalogMobileNav";
import { SearchField } from "@/components/ui/search-field";
import { cn, formatCurrency } from "@/lib/utils";
import { IMPORT_DEFAULT_VARIANT_LABEL } from "@/features/products/import";
import type { InventoryItem } from "../types";
import { InventoryItemSheet, type InventoryItemValues } from "./InventoryItemSheet";

/** Igual que el badge de la tabla de escritorio: menos de 10 es stock bajo. */
const LOW_STOCK = 10;

type StockKind = "out" | "low" | "ok" | "untracked";
type MobileFilter = "all" | "out" | "low" | "off";

function stockKind(item: InventoryItem): StockKind {
  if (item.stock === null) return "untracked";
  if (item.stock === 0) return "out";
  return item.stock < LOW_STOCK ? "low" : "ok";
}

const STOCK_BADGE: Record<StockKind, string> = {
  out: "bg-red-100 text-red-800",
  low: "bg-amber-100 text-amber-800",
  ok: "bg-emerald-50 text-emerald-800",
  untracked: "bg-slate-200 text-slate-700",
};

const FILTERS: Record<MobileFilter, (item: InventoryItem) => boolean> = {
  all: () => true,
  out: (item) => stockKind(item) === "out",
  low: (item) => stockKind(item) === "low",
  off: (item) => !item.isAvailable,
};

interface InventoryMobileViewProps {
  items: InventoryItem[];
  /** Total en la sede: la lista trae como máximo 100 (sin paginar). */
  total: number;
  isLoading: boolean;
  branchId: string;
  onBranchChange: (branchId: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  /** `inventory.set_availability`: sin él, la disponibilidad solo se ve. */
  canSetAvailability: boolean;
  onToggleAvailability: (item: InventoryItem, isAvailable: boolean) => void;
  /** Guarda lo editado en la hoja; resuelve al terminar (o rechaza). */
  onSave: (item: InventoryItem, values: InventoryItemValues) => Promise<void>;
}

export function InventoryMobileView({
  items,
  total,
  isLoading,
  branchId,
  onBranchChange,
  search,
  onSearchChange,
  canSetAvailability,
  onToggleAvailability,
  onSave,
}: InventoryMobileViewProps) {
  const t = useTranslations("inventory");
  const [filter, setFilter] = useState<MobileFilter>("all");
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const itemName = (item: InventoryItem) =>
    item.variantLabel && item.variantLabel !== IMPORT_DEFAULT_VARIANT_LABEL
      ? `${item.productName} · ${item.variantLabel}`
      : item.productName;
  const visible = useMemo(() => items.filter(FILTERS[filter]), [items, filter]);

  const count = (id: MobileFilter) => items.filter(FILTERS[id]).length;
  const stockLabel = (item: InventoryItem) => {
    const kind = stockKind(item);
    if (kind === "untracked") return t("mobile.untracked");
    if (kind === "out") return t("table.outOfStock");
    return kind === "low"
      ? t("mobile.unitsLow", { count: item.stock ?? 0 })
      : t("mobile.units", { count: item.stock ?? 0 });
  };

  return (
    <div className="-mx-4 -mt-4 flex flex-col sm:-mx-6 sm:-mt-6" data-testid="inventory-mobile-view">
      <div className="flex flex-col gap-2.5 border-b border-slate-200/70 bg-white px-4 pb-3 pt-1 sm:px-6">
        <BranchSingleSelector value={branchId || null} onChange={(id) => onBranchChange(id as string)} />
        <SearchField value={search} onChange={onSearchChange} placeholder={t("table.search")} />
        <PillGroup
          label={t("mobile.stockFilter")}
          value={filter}
          onChange={setFilter}
          className="-mx-4 px-4 sm:-mx-6 sm:px-6"
          options={[
            { id: "all", label: t("mobile.filters.all"), count: count("all"), dotClassName: "bg-slate-400" },
            { id: "out", label: t("mobile.filters.out"), count: count("out"), dotClassName: "bg-red-600" },
            { id: "low", label: t("mobile.filters.low"), count: count("low"), dotClassName: "bg-amber-600" },
            { id: "off", label: t("mobile.filters.off"), count: count("off"), dotClassName: "bg-slate-500" },
          ]}
        />
      </div>

      <div className="p-3 sm:px-6">
        {isLoading ? (
          <div className="flex flex-col gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="mt-8 text-center text-[15px] text-slate-500">{t("mobile.empty")}</p>
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white">
            {visible.map((item) => {
              const kind = stockKind(item);
              const hasOverride = item.effectivePrice !== item.basePrice;
              return (
                <li key={item.id} className="flex min-h-16 items-center gap-3 px-3.5 py-2.5">
                  <button
                    type="button"
                    onClick={() => setEditing(item)}
                    className={cn(
                      "flex min-w-0 flex-1 flex-col gap-1 text-left",
                      !item.isAvailable && "opacity-55"
                    )}
                  >
                    <span className="truncate text-[15px] font-semibold text-slate-900">
                      {itemName(item)}
                    </span>
                    <span className="flex flex-wrap items-center gap-2 text-sm">
                      <span
                        className={cn(
                          "flex h-[22px] items-center rounded-full px-2 text-[11px] font-bold",
                          STOCK_BADGE[kind]
                        )}
                      >
                        {stockLabel(item)}
                      </span>
                      <span className="font-bold tabular-nums text-slate-900">
                        {formatCurrency(item.effectivePrice)}
                      </span>
                      {hasOverride && (
                        <span className="text-xs tabular-nums text-slate-400 line-through">
                          {formatCurrency(item.basePrice)}
                        </span>
                      )}
                    </span>
                  </button>
                  {canSetAvailability ? (
                    <Switch
                      checked={item.isAvailable}
                      onCheckedChange={(checked) => onToggleAvailability(item, checked)}
                      aria-label={t("mobile.availableFor", { name: itemName(item) })}
                    />
                  ) : (
                    <span
                      className={cn(
                        "shrink-0 text-xs font-semibold",
                        item.isAvailable ? "text-emerald-700" : "text-slate-500"
                      )}
                    >
                      {item.isAvailable ? t("mobile.available") : t("mobile.unavailable")}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {total > items.length && (
        <p className="px-4 pb-3 text-center text-xs text-slate-500">
          {t("mobile.partial", { shown: items.length, total })}
        </p>
      )}

      {editing && (
        <InventoryItemSheet
          key={editing.id}
          item={editing}
          title={itemName(editing)}
          canSetAvailability={canSetAvailability}
          isSaving={saving}
          onClose={() => setEditing(null)}
          onSave={(values) => {
            setSaving(true);
            onSave(editing, values)
              .then(() => setEditing(null))
              .catch(() => {})
              .finally(() => setSaving(false));
          }}
        />
      )}

      <CatalogMobileNav />
    </div>
  );
}

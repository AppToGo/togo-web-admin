"use client";

/**
 * Inventario de la sede en tarjetas (antes BranchInventoryTable): una
 * columna en el teléfono, dos en tablet y tres o más en escritorio, sin
 * scroll horizontal. Stock y precio se editan en la tarjeta con el mismo
 * debounce de antes; la selección alimenta las acciones masivas.
 */

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { InventoryCard } from "./InventoryCard";
import type { InventoryItem } from "../types";

/** Múltiplo de 2, 3 y 4: las columnas de tarjetas quedan completas. */
const PAGE_SIZE = 24;

const PAGE_BUTTON = "h-10 rounded-card border-0 bg-white px-4 text-slate-700 shadow-none";

interface BranchInventoryGridProps {
  data: InventoryItem[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onToggleAvailability: (item: InventoryItem, isAvailable: boolean) => void;
  debouncedUpdate?: (
    productId: string,
    field: "stock" | "priceOverride",
    value: number
  ) => void;
  readOnly?: boolean;
  /** `inventory.set_availability`: sin él, la disponibilidad solo se ve. */
  canSetAvailability?: boolean;
  showProductImages?: boolean;
}

export function BranchInventoryGrid({
  data,
  isLoading,
  selectedIds,
  onToggleSelection,
  onSelectAll,
  onToggleAvailability,
  debouncedUpdate,
  readOnly = false,
  canSetAvailability = true,
  showProductImages = false,
}: BranchInventoryGridProps) {
  const t = useTranslations("inventory");
  const tc = useTranslations("common");
  const [page, setPage] = useState(1);

  // Valores en edición, hasta que el servidor devuelve los nuevos datos.
  const [editingStock, setEditingStock] = useState<Record<string, string>>({});
  const [editingPrice, setEditingPrice] = useState<Record<string, string>>({});

  const [prevData, setPrevData] = useState(data);
  if (data !== prevData) {
    setPrevData(data);
    setEditingStock({});
    setEditingPrice({});
  }

  // Otra búsqueda o filtro cambia la cantidad: vuelve a la primera página
  // (editar stock o precio refresca los datos sin cambiarla).
  const [prevCount, setPrevCount] = useState(data.length);
  if (data.length !== prevCount) {
    setPrevCount(data.length);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => data.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [data, currentPage]
  );

  const allSelected =
    data.length > 0 && data.every((item) => selectedIds.has(item.productVariantId));

  const handleSelectAll = useCallback(() => {
    onSelectAll(allSelected ? [] : data.map((item) => item.productVariantId));
  }, [allSelected, data, onSelectAll]);

  const handleStockChange = useCallback(
    (productId: string, value: string) => {
      setEditingStock((prev) => ({ ...prev, [productId]: value }));
      const numValue = value === "" ? null : parseInt(value, 10);
      if (numValue !== null && !isNaN(numValue) && numValue >= 0) {
        debouncedUpdate?.(productId, "stock", numValue);
      }
    },
    [debouncedUpdate]
  );

  const handlePriceChange = useCallback(
    (productId: string, value: string) => {
      setEditingPrice((prev) => ({ ...prev, [productId]: value }));
      const numValue = value === "" ? null : parseFloat(value);
      if (numValue !== null && !isNaN(numValue) && numValue > 0) {
        debouncedUpdate?.(productId, "priceOverride", numValue);
      }
    },
    [debouncedUpdate]
  );

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-3xl bg-white/60" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card-xl border border-white/80 bg-white/45 px-4 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
          <Package className="h-8 w-8 text-indigo-500" />
        </div>
        <h3 className="mb-1 text-lg font-semibold text-slate-900">
          {t("table.empty.title")}
        </h3>
        <p className="max-w-sm text-slate-500">{t("table.empty.message")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!readOnly && (
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} />
          {t("card.selectAll", { count: data.length })}
        </label>
      )}

      <ul
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        data-testid="inventory-grid"
      >
        {pageItems.map((item) => (
          <InventoryCard
            key={item.productVariantId}
            item={item}
            isSelected={selectedIds.has(item.productVariantId)}
            onToggleSelection={() => onToggleSelection(item.productVariantId)}
            onToggleAvailability={(checked) => onToggleAvailability(item, checked)}
            stockDraft={editingStock[item.productVariantId]}
            priceDraft={editingPrice[item.productVariantId]}
            onStockChange={(value) => handleStockChange(item.productVariantId, value)}
            onPriceChange={(value) => handlePriceChange(item.productVariantId, value)}
            readOnly={readOnly}
            canSetAvailability={canSetAvailability}
            showProductImage={showProductImages}
          />
        ))}
      </ul>

      {totalPages > 1 && (
        <nav
          aria-label={t("card.pagination")}
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-sm text-slate-500">
            {t("table.showing", { count: pageItems.length, total: data.length })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="slate-outline"
              className={PAGE_BUTTON}
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft />
              {tc("pagination.previous")}
            </Button>
            <span className="px-2 text-sm text-slate-600">
              {tc("pagination.pageOf", { page: currentPage, totalPages })}
            </span>
            <Button
              variant="slate-outline"
              className={PAGE_BUTTON}
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              {tc("pagination.next")}
              <ChevronRight />
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}

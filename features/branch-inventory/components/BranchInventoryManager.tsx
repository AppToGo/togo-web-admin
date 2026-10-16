"use client";

/**
 * BranchInventoryManager Component
 *
 * Componente principal de gestión de inventario por sede.
 * Combina: selector de sede, tabla de inventario, acciones masivas y estadísticas.
 */

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Store, Package, AlertTriangle, CheckCircle, XCircle, Search, Warehouse } from "lucide-react";
import { PillGroup } from "@/components/ui/pill-group";
import { KpiCard } from "@/features/dashboard/components/kpi/KpiCard";
import { formatCurrency } from "@/lib/utils";
import {
  useBranchInventory,
  useActivateProduct,
  useDeactivateProduct,
  useBulkActivate,
  useDebouncedInventoryUpdate,
  useUpdateStock,
  useSetAvailability,
  useUpdateInventory,
} from "../hooks/useBranchInventory";
import { BranchInventoryGrid } from "./BranchInventoryGrid";
import { BulkInventoryActions } from "./BulkInventoryActions";
import {
  InventoryFilters,
  stockFilterToStatuses,
  type AvailabilityFilterState,
  type StockFilterState,
} from "./InventoryFilters";
import type { InventoryItem, BranchSummary, InventoryFilters as InventoryFiltersType } from "../types";
import { useCategories } from "@/features/catalog/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BranchSingleSelector } from "@/features/branches/components";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import { InventoryMobileView } from "./InventoryMobileView";
import type { InventoryItemValues } from "./InventoryItemSheet";

/** Atajos de stock (los mismos que en el teléfono). */
const QUICK_FILTERS = ["all", "out", "low", "off"] as const;
type QuickFilter = (typeof QUICK_FILTERS)[number];
const QUICK_FILTER_DOT: Record<QuickFilter, string> = {
  all: "bg-slate-400",
  out: "bg-red-600",
  low: "bg-amber-600",
  off: "bg-slate-500",
};

interface BranchInventoryManagerProps {
  readOnly?: boolean;
  showProductImages?: boolean;
  businessId: string;
  branches: BranchSummary[];
}

// Stats card component
function ActivateProductDialog({
  isOpen,
  onClose,
  onConfirm,
  product,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    stock?: number;
    isAvailable: boolean;
    priceOverride?: number;
  }) => void;
  product: InventoryItem | null;
  isLoading: boolean;
}) {
  const t = useTranslations("inventory");
  const [stock, setStock] = useState<string>("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [priceOverride, setPriceOverride] = useState<string>("");

  const handleConfirm = useCallback(() => {
    onConfirm({
      stock: stock ? parseInt(stock, 10) : undefined,
      isAvailable,
      priceOverride: priceOverride ? parseFloat(priceOverride) : undefined,
    });
    setStock("");
    setIsAvailable(true);
    setPriceOverride("");
  }, [stock, isAvailable, priceOverride, onConfirm]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("activate.title")}</DialogTitle>
          <DialogDescription>
            {product &&
              t("activate.description", { name: product.productName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-4">
          {/* Price override */}
          <div className="space-y-2">
            <Label htmlFor="activate-price">
              {t("activate.priceOverride")}
            </Label>
            <div className="relative">
              <Input
                id="activate-price"
                type="number"
                min={0.01}
                step={0.01}
                placeholder={product?.basePrice.toString()}
                value={priceOverride}
                onChange={(e) => setPriceOverride(e.target.value)}
              />
              {product && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  {t("activate.basePrice", {
                    price: formatCurrency(product.basePrice),
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Stock */}
          <div className="space-y-2">
            <Label htmlFor="activate-stock">{t("activate.stock")}</Label>
            <Input
              id="activate-stock"
              type="number"
              min={0}
              placeholder={t("activate.stockPlaceholder")}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>

          {/* Availability */}
          <div className="flex items-center justify-between">
            <Label htmlFor="activate-available">
              {t("activate.available")}
            </Label>
            <Switch
              id="activate-available"
              checked={isAvailable}
              onCheckedChange={setIsAvailable}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("activate.cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                {t("activate.processing")}
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                {t("activate.confirm")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BranchInventoryManager({
  businessId,
  branches,
  readOnly = false,
  showProductImages = false,
}: BranchInventoryManagerProps) {
  const t = useTranslations("inventory");

  // State - initialize with main branch or first available branch
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    const mainBranch = branches.find((b) => b.isMainBranch);
    return mainBranch?.id || branches[0]?.id || "";
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const isMobile = useIsMobile();
  // Mismo permiso que el endpoint de disponibilidad; stock y precio de la
  // sede no tienen permiso propio en la API.
  const { hasPermission } = useMyPermissions();
  const canSetAvailability = hasPermission("inventory.set_availability");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activatingProduct, setActivatingProduct] =
    useState<InventoryItem | null>(null);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState("all"); // industryCategoryId
  const [selectedSubcategory, setSelectedSubcategory] = useState("all"); // categoryId (BusinessCategory)
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilterState>({
    available: true,
    unavailable: true,
  });
  const handleCategoryChange = useCallback((value: string) => {
    setSelectedCategory(value);
    // La subcategoría seleccionada podría no pertenecer a la nueva categoría padre
    setSelectedSubcategory("all");
  }, []);

  const [stockFilter, setStockFilter] = useState<StockFilterState>({
    out: true,
    in: true,
    low: true,
    untracked: true,
  });

  const { data: categoriesData } = useCategories(businessId);
  const categories = categoriesData ?? [];

  const activeFiltersCount = useMemo(() => {
    const hasCategoryFilter = selectedCategory !== "all";
    const hasSubcategoryFilter = selectedSubcategory !== "all";
    const hasAvailabilityFilter =
      !availabilityFilter.available || !availabilityFilter.unavailable;
    const hasStockFilter =
      !stockFilter.out || !stockFilter.in || !stockFilter.low || !stockFilter.untracked;
    return [
      hasCategoryFilter,
      hasSubcategoryFilter,
      hasAvailabilityFilter,
      hasStockFilter,
    ].filter(Boolean).length;
  }, [selectedCategory, selectedSubcategory, availabilityFilter, stockFilter]);

  const clearAllFilters = useCallback(() => {
    setSelectedCategory("all");
    setSelectedSubcategory("all");
    setAvailabilityFilter({ available: true, unavailable: true });
    setStockFilter({ out: true, in: true, low: true, untracked: true });
  }, []);

  const inventoryFilters: InventoryFiltersType = useMemo(() => {
    // Teléfono: solo la búsqueda. Los filtros de escritorio no tienen control
    // ahí y, si quedaron puestos, recortarían la lista sin que se vea.
    if (isMobile) return { search: globalFilter || undefined, limit: 100 };

    // Traduce el par de switches a un booleano tri-state, mismo patrón que
    // sourceFilter -> isFromTemplate en catalog/products/page.tsx
    const isAvailable =
      availabilityFilter.available && !availabilityFilter.unavailable
        ? true
        : !availabilityFilter.available && availabilityFilter.unavailable
          ? false
          : undefined;

    return {
      search: globalFilter || undefined,
      industryCategoryId: selectedCategory !== "all" ? selectedCategory : undefined,
      categoryId: selectedSubcategory !== "all" ? selectedSubcategory : undefined,
      isAvailable,
      stockStatus: stockFilterToStatuses(stockFilter),
      limit: 100,
    };
  }, [isMobile, globalFilter, selectedCategory, selectedSubcategory, availabilityFilter, stockFilter]);

  // Queries
  const {
    data: inventoryData,
    isLoading,
  } = useBranchInventory(businessId, selectedBranchId || null, inventoryFilters);

  // Mutations
  const activateMutation = useActivateProduct(businessId, selectedBranchId);
  const deactivateMutation = useDeactivateProduct(businessId, selectedBranchId);
  const bulkActivateMutation = useBulkActivate(businessId, selectedBranchId);
  const updateStockMutation = useUpdateStock(businessId, selectedBranchId);
  const updateInventoryMutation = useUpdateInventory(businessId, selectedBranchId);
  const setAvailabilityMutation = useSetAvailability(
    businessId,
    selectedBranchId
  );

  // Debounced update
  const { queueUpdate } = useDebouncedInventoryUpdate(
    businessId,
    selectedBranchId,
    useCallback(() => {
      // Optional: Show success toast for auto-save
    }, [])
  );

  // Derived data
  const items = inventoryData?.items || [];

  const stats = useMemo(() => {
    const total = items.length;
    const available = items.filter((i) => i.isAvailable).length;
    const lowStock = items.filter(
      (i) => i.isAvailable && i.stock !== null && i.stock < 10
    ).length;
    const outOfStock = items.filter(
      (i) => i.isAvailable && i.stock === 0
    ).length;

    return { total, available, lowStock, outOfStock };
  }, [items]);

  // Selection handlers
  const handleToggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Activation handlers
  const handleConfirmActivate = useCallback(
    (data: {
      stock?: number;
      isAvailable: boolean;
      priceOverride?: number;
    }) => {
      if (!activatingProduct) return;

      activateMutation.mutate(
        {
          productId: activatingProduct.productVariantId,
          data,
        },
        {
          onSuccess: () => {
            setActivatingProduct(null);
          },
        }
      );
    },
    [activatingProduct, activateMutation]
  );

  // Bulk action handlers
  const handleBulkActivate = useCallback(
    (options: { defaultStock?: number; defaultIsAvailable: boolean }) => {
      const productIds = Array.from(selectedIds);
      bulkActivateMutation.mutate(
        {
          productIds,
          defaultStock: options.defaultStock,
          defaultIsAvailable: options.defaultIsAvailable,
        },
        {
          onSuccess: () => {
            handleClearSelection();
          },
        }
      );
    },
    [selectedIds, bulkActivateMutation, handleClearSelection]
  );

  const handleBulkDeactivate = useCallback(() => {
    // Deactivate products one by one (bulk delete not available in API)
    const productIds = Array.from(selectedIds);
    Promise.all(
      productIds.map((id) => deactivateMutation.mutateAsync(id))
    ).then(() => {
      handleClearSelection();
    });
  }, [selectedIds, deactivateMutation, handleClearSelection]);

  const handleBulkAdjustStock = useCallback(
    (adjustment: number) => {
      // Adjust stock for each selected product
      const productIds = Array.from(selectedIds);
      Promise.all(
        productIds.map((id) =>
          updateStockMutation.mutateAsync({
            productId: id,
            quantity: adjustment,
          })
        )
      ).then(() => {
        handleClearSelection();
      });
    },
    [selectedIds, updateStockMutation, handleClearSelection]
  );

  // Handle toggle availability
  const handleToggleAvailability = useCallback(
    (productId: string, isAvailable: boolean) => {
      setAvailabilityMutation.mutate({ productId, isAvailable });
    },
    [setAvailabilityMutation]
  );

  // Sin activar en la sede, prenderlo es activarlo (teléfono y escritorio).
  const toggleAvailability = (item: InventoryItem, isAvailable: boolean) => {
    if (!item.isActivated) {
      if (isAvailable) {
        activateMutation.mutate({ productId: item.productVariantId, data: { isAvailable } });
      }
      return;
    }
    handleToggleAvailability(item.productVariantId, isAvailable);
  };

  // Atajos de stock: cada pastilla fija los filtros de stock y
  // disponibilidad; el popover de filtros sigue sirviendo para combinarlos.
  const allStock: StockFilterState = { out: true, in: true, low: true, untracked: true };
  const noStock: StockFilterState = { out: false, in: false, low: false, untracked: false };
  const isAllStock =
    stockFilter.out && stockFilter.in && stockFilter.low && stockFilter.untracked;
  const isAllAvailability = availabilityFilter.available && availabilityFilter.unavailable;
  const quickFilter: QuickFilter | null =
    isAllStock && isAllAvailability
      ? "all"
      : isAllAvailability && stockFilter.out && !stockFilter.in && !stockFilter.low && !stockFilter.untracked
        ? "out"
        : isAllAvailability && stockFilter.low && !stockFilter.in && !stockFilter.out && !stockFilter.untracked
          ? "low"
          : isAllStock && !availabilityFilter.available && availabilityFilter.unavailable
            ? "off"
            : null;
  const applyQuickFilter = (key: QuickFilter) => {
    setAvailabilityFilter(
      key === "off"
        ? { available: false, unavailable: true }
        : { available: true, unavailable: true }
    );
    setStockFilter(
      key === "out"
        ? { ...noStock, out: true }
        : key === "low"
          ? { ...noStock, low: true }
          : allStock
    );
  };

  // Teléfono: lista propia (diseño móvil) con la misma sede y búsqueda.
  if (isMobile) {
    // Sin activar en la sede: se activa con lo editado. Activado: stock y
    // precio por PATCH y la disponibilidad por su endpoint (con permiso).
    const saveFromPhone = async (item: InventoryItem, values: InventoryItemValues) => {
      const productId = item.productVariantId;
      try {
        if (!item.isActivated) {
          await activateMutation.mutateAsync({
            productId,
            data: {
              isAvailable: values.isAvailable,
              stock: values.stock ?? undefined,
              priceOverride: values.priceOverride ?? undefined,
            },
          });
          return;
        }
        await updateInventoryMutation.mutateAsync({
          productId,
          data: { stock: values.stock, priceOverride: values.priceOverride },
        });
        if (canSetAvailability && values.isAvailable !== item.isAvailable) {
          await setAvailabilityMutation.mutateAsync({
            productId,
            isAvailable: values.isAvailable,
          });
        }
        toast.success(t("mobile.saved"));
      } catch (error) {
        // La activación ya avisa el error con su propio toast.
        if (item.isActivated) {
          toast.error(t("mobile.saveError", { error: (error as Error).message }));
        }
        throw error;
      }
    };

    return (
      <InventoryMobileView
        items={items}
        total={inventoryData?.total ?? items.length}
        isLoading={isLoading}
        branchId={selectedBranchId}
        onBranchChange={setSelectedBranchId}
        search={globalFilter}
        onSearchChange={setGlobalFilter}
        canSetAvailability={canSetAvailability}
        onToggleAvailability={toggleAvailability}
        onSave={saveFromPhone}
      />
    );
  }

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Warehouse className="h-6 w-6 text-indigo-600" />
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
        </div>
        {setSelectedBranchId && (
          <BranchSingleSelector
            value={selectedBranchId || null}
            onChange={(val) => setSelectedBranchId(val as string)}
          />
        )}
      </div>

      {selectedBranchId && (
        <section
          aria-label={t("stats.label")}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <KpiCard
            title={t("stats.total")}
            value={isLoading ? "—" : String(stats.total)}
            description={t("stats.totalHint")}
            icon={<Package className="h-5 w-5 text-blue-600" />}
            variant="blue"
          />
          <KpiCard
            title={t("stats.available")}
            value={isLoading ? "—" : String(stats.available)}
            description={t("stats.availableHint")}
            icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
            variant="emerald"
          />
          <KpiCard
            title={t("stats.lowStock")}
            value={isLoading ? "—" : String(stats.lowStock)}
            description={t("stats.lowStockHint")}
            icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
            variant="amber"
          />
          <KpiCard
            title={t("stats.outOfStock")}
            value={isLoading ? "—" : String(stats.outOfStock)}
            description={t("stats.outOfStockHint")}
            icon={<XCircle className="h-5 w-5 text-purple-600" />}
            variant="purple"
          />
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-auto sm:min-w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder={t("table.search")}
            aria-label={t("table.search")}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-11 w-full rounded-card border-0 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <PillGroup
          label={t("mobile.stockFilter")}
          value={quickFilter}
          onChange={applyQuickFilter}
          appearance="glass"
          options={QUICK_FILTERS.map((key) => ({
            id: key,
            label: t(`mobile.filters.${key}`),
            dotClassName: QUICK_FILTER_DOT[key],
          }))}
        />
        <div className="sm:ml-auto">
          <InventoryFilters
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            selectedSubcategory={selectedSubcategory}
            onSubcategoryChange={setSelectedSubcategory}
            availabilityFilter={availabilityFilter}
            onAvailabilityFilterChange={setAvailabilityFilter}
            stockFilter={stockFilter}
            onStockFilterChange={setStockFilter}
            activeFiltersCount={activeFiltersCount}
            onClearFilters={clearAllFilters}
          />
        </div>
      </div>

      {selectedBranchId ? (
        <BranchInventoryGrid
          data={items}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onToggleSelection={handleToggleSelection}
          onSelectAll={handleSelectAll}
          onToggleAvailability={toggleAvailability}
          debouncedUpdate={queueUpdate}
          readOnly={readOnly}
          canSetAvailability={canSetAvailability}
          showProductImages={showProductImages}
        />
      ) : (
        <div className="rounded-card-xl border border-white/80 bg-white/45 p-12 text-center">
          <Store className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <h3 className="mb-1 text-lg font-medium text-slate-900">
            {t("noBranch.title")}
          </h3>
          <p className="text-slate-500">{t("noBranch.message")}</p>
        </div>
      )}

      {/* Bulk Actions */}
      <BulkInventoryActions
        selectedCount={selectedIds.size}
        onClearSelection={handleClearSelection}
        onBulkActivate={handleBulkActivate}
        onBulkDeactivate={handleBulkDeactivate}
        onBulkAdjustStock={handleBulkAdjustStock}
        isLoading={
          bulkActivateMutation.isPending ||
          deactivateMutation.isPending ||
          updateStockMutation.isPending
        }
      />

      {/* Activation Dialog */}
      <ActivateProductDialog
        isOpen={!!activatingProduct}
        onClose={() => setActivatingProduct(null)}
        onConfirm={handleConfirmActivate}
        product={activatingProduct}
        isLoading={activateMutation.isPending}
      />
    </div>
  );
}

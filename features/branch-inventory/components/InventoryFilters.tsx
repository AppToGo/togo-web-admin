"use client";

/**
 * InventoryFilters Component
 *
 * Botón de filtro con popover para la tabla de inventario por sede.
 * Mismo patrón visual que ProductFilters (features/catalog/components/ProductFilters.tsx):
 * botón con badge de conteo + Popover con secciones de Select/Switch.
 * A diferencia de ProductFilters, este componente es solo el botón + popover
 * (el buscador y el selector de sede ya viven en BranchInventoryManager).
 */

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Filter,
  FolderOpen,
  Tags,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Store,
  Building2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BusinessCategory } from "@/features/catalog/types/catalog.types";
import type { StockStatusFilter } from "../types";

export interface AvailabilityFilterState {
  available: boolean;
  unavailable: boolean;
}

export interface StockFilterState {
  out: boolean;
  in: boolean;
  low: boolean;
  untracked: boolean;
}

interface InventoryFiltersProps {
  categories: BusinessCategory[];
  selectedCategory: string; // industryCategoryId, "all" = sin filtro
  onCategoryChange: (value: string) => void;
  selectedSubcategory: string; // businessCategoryId, "all" = sin filtro
  onSubcategoryChange: (value: string) => void;
  availabilityFilter: AvailabilityFilterState;
  onAvailabilityFilterChange: (value: AvailabilityFilterState) => void;
  stockFilter: StockFilterState;
  onStockFilterChange: (value: StockFilterState) => void;
  activeFiltersCount: number;
  onClearFilters: () => void;
}

export function stockFilterToStatuses(
  stockFilter: StockFilterState
): StockStatusFilter[] | undefined {
  const allSelected =
    stockFilter.out && stockFilter.in && stockFilter.low && stockFilter.untracked;
  if (allSelected) return undefined;

  const statuses: StockStatusFilter[] = [];
  if (stockFilter.out) statuses.push("out");
  if (stockFilter.in) statuses.push("in");
  if (stockFilter.low) statuses.push("low");
  if (stockFilter.untracked) statuses.push("untracked");
  return statuses;
}

export function InventoryFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  selectedSubcategory,
  onSubcategoryChange,
  availabilityFilter,
  onAvailabilityFilterChange,
  stockFilter,
  onStockFilterChange,
  activeFiltersCount,
  onClearFilters,
}: InventoryFiltersProps) {
  const t = useTranslations("inventory");
  const tc = useTranslations("common");

  // Categorías padre (IndustryCategory) únicas, derivadas de las subcategorías del negocio
  const parentCategories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const cat of categories) {
      if (!seen.has(cat.industryCategoryId)) {
        seen.set(cat.industryCategoryId, cat.industryCategoryName ?? cat.industryCategoryId);
      }
    }
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  // Subcategorías filtradas por la categoría padre seleccionada (mismo patrón que ProductForm)
  const filteredSubcategories = useMemo(() => {
    const list =
      selectedCategory === "all"
        ? categories
        : categories.filter((c) => c.industryCategoryId === selectedCategory);
    return list
      .map((c) => ({ id: c.id, name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, selectedCategory]);

  const hasAnyFilter = activeFiltersCount > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "relative flex items-center justify-center w-10 h-10 rounded-card transition-all duration-200",
            hasAnyFilter
              ? "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
              : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200"
          )}
          title={tc("buttons.filter")}
        >
          <Filter className="w-4 h-4" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-sm text-slate-900">
            {t("filters.title")}
          </h3>
          {hasAnyFilter && (
            <button
              onClick={onClearFilters}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {tc("buttons.clearAll")}
            </button>
          )}
        </div>

        <div className="p-4 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Estado (disponibilidad) */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <Store className="w-3.5 h-3.5" />
              {t("filters.availability.title")}
            </h4>
            <div className="space-y-2">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm text-slate-700 group-hover:text-slate-900">
                    {t("filters.availability.available")}
                  </span>
                </div>
                <Switch
                  checked={availabilityFilter.available}
                  onCheckedChange={(checked) =>
                    onAvailabilityFilterChange({ ...availabilityFilter, available: checked })
                  }
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <XCircle className="w-4 h-4 text-slate-500" />
                  </div>
                  <span className="text-sm text-slate-700 group-hover:text-slate-900">
                    {t("filters.availability.unavailable")}
                  </span>
                </div>
                <Switch
                  checked={availabilityFilter.unavailable}
                  onCheckedChange={(checked) =>
                    onAvailabilityFilterChange({ ...availabilityFilter, unavailable: checked })
                  }
                />
              </label>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Categoría */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <FolderOpen className="w-3.5 h-3.5" />
              {t("filters.category")}
            </h4>
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("filters.categoryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allCategories")}</SelectItem>
                {parentCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategoría */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" />
              {t("filters.subcategory")}
            </h4>
            <Select value={selectedSubcategory} onValueChange={onSubcategoryChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("filters.subcategoryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allSubcategories")}</SelectItem>
                {filteredSubcategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Stock */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <Tags className="w-3.5 h-3.5" />
              {t("filters.stock.title")}
            </h4>
            <div className="space-y-2">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <XCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-sm text-slate-700 group-hover:text-slate-900">
                    {t("filters.stock.out")}
                  </span>
                </div>
                <Switch
                  checked={stockFilter.out}
                  onCheckedChange={(checked) =>
                    onStockFilterChange({ ...stockFilter, out: checked })
                  }
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm text-slate-700 group-hover:text-slate-900">
                    {t("filters.stock.in")}
                  </span>
                </div>
                <Switch
                  checked={stockFilter.in}
                  onCheckedChange={(checked) =>
                    onStockFilterChange({ ...stockFilter, in: checked })
                  }
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-sm text-slate-700 group-hover:text-slate-900">
                    {t("filters.stock.low")}
                  </span>
                </div>
                <Switch
                  checked={stockFilter.low}
                  onCheckedChange={(checked) =>
                    onStockFilterChange({ ...stockFilter, low: checked })
                  }
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-sm font-semibold">
                    ∞
                  </div>
                  <span className="text-sm text-slate-700 group-hover:text-slate-900">
                    {t("filters.stock.untracked")}
                  </span>
                </div>
                <Switch
                  checked={stockFilter.untracked}
                  onCheckedChange={(checked) =>
                    onStockFilterChange({ ...stockFilter, untracked: checked })
                  }
                />
              </label>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

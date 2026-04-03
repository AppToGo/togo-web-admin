"use client";

/**
 * ProductFilters Component
 * 
 * Filtros para productos con patrón popover similar a órdenes.
 * - Buscador nativo estilo órdenes
 * - BranchSingleSelector fuera del popover
 * - Botón filtro con popover que contiene Select de categoría y switches para estados
 */

import { useTranslations } from "next-intl";
import { Search, Filter, Package, Store, Building2, FolderOpen, X } from "lucide-react";
import { ViewToggle } from "@/components/ui/view-toggle";
import { Switch } from "@/components/ui/switch";

import { BranchSingleSelector } from "@/features/branches/components";
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

interface Category {
  id: string;
  name: string;
}

interface ProductFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  categories: Category[];
  // Filtros HYBRID
  selectedBranchId?: string | null;
  onBranchChange?: (branchId: string | null) => void;
  activationFilter?: { activated: boolean; notActivated: boolean };
  onActivationFilterChange?: (value: { activated: boolean; notActivated: boolean }) => void;
  // Conteo y limpieza de filtros
  activeFiltersCount: number;
  onClearFilters: () => void;
}

export function ProductFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  viewMode,
  onViewModeChange,
  categories,
  selectedBranchId,
  onBranchChange,
  activationFilter,
  onActivationFilterChange,
  activeFiltersCount,
  onClearFilters,
}: ProductFiltersProps) {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");

  // Verificar si hay filtros activos
  const hasCategoryFilter = selectedCategory !== "all";
  const hasActivationFilter = selectedBranchId && activationFilter &&
    (!activationFilter.activated || !activationFilter.notActivated);
  
  const hasAnyFilter = hasCategoryFilter || !!hasActivationFilter;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Buscador estilo órdenes */}
      <div className="flex items-center bg-white rounded-card px-4 py-2.5 w-full sm:w-auto sm:min-w-64 border border-slate-200">
        <Search className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
        <input
          type="text"
          placeholder={t("products.search")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="ml-2 p-0.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Branch Single Selector - siempre visible */}
      {onBranchChange && (
        <BranchSingleSelector
          value={selectedBranchId || null}
          onChange={onBranchChange}
        />
      )}

      {/* Botón de filtros con popover */}
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
              {t("products.filters.title")}
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
            {/* Filtro de Categoría */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                <FolderOpen className="w-3.5 h-3.5" />
                {t("products.filters.category")}
              </h4>
              <Select value={selectedCategory} onValueChange={onCategoryChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("products.filters.categoryPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("products.filters.allCategories")}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Estado en Sede (solo cuando hay sede seleccionada) */}
            {selectedBranchId && activationFilter && onActivationFilterChange && (
              <>
                {/* Separador */}
                <div className="h-px bg-slate-100" />

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5" />
                    {t("hybridFilters.branchStatus.title")}
                  </h4>
                  <div className="space-y-2">
                    {/* Switch Activados en sede */}
                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <Store className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="text-sm text-slate-700 group-hover:text-slate-900">
                          {t("hybridFilters.activated")}
                        </span>
                      </div>
                      <Switch
                        checked={activationFilter.activated}
                        onCheckedChange={(checked) =>
                          onActivationFilterChange({ ...activationFilter, activated: checked })
                        }
                      />
                    </label>

                    {/* Switch No activados en sede */}
                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-slate-500" />
                        </div>
                        <span className="text-sm text-slate-700 group-hover:text-slate-900">
                          {t("hybridFilters.notActivated")}
                        </span>
                      </div>
                      <Switch
                        checked={activationFilter.notActivated}
                        onCheckedChange={(checked) =>
                          onActivationFilterChange({ ...activationFilter, notActivated: checked })
                        }
                      />
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* View Toggle */}
      <div className="ml-auto">
        <ViewToggle
          value={viewMode}
          onChange={(value) => onViewModeChange(value as "grid" | "list")}
        />
      </div>
    </div>
  );
}

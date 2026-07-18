"use client";

/**
 * GlobalCatalogFilters Component
 *
 * Filtros para catálogo global con patrón popover.
 * - Buscador nativo estilo órdenes
 * - Botón filtro con popover que contiene MultiSelect de categorías industriales
 *   y Select de marca dinámico
 * - ViewToggle alineado a la derecha
 */

import { useTranslations } from "next-intl";
import { Search, Filter, FolderOpen, Tag, X } from "lucide-react";
import { ViewToggle } from "@/components/ui/view-toggle";
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
import { MultiSelect } from "@/components/ui/multi-select";

interface IndustryCategory {
  id: string;
  name: string;
}

interface GlobalCatalogFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  industryCategories: IndustryCategory[];
  selectedIndustryCategories: string[];
  onIndustryCategoriesChange: (values: string[]) => void;
  brands: string[];
  selectedBrand: string;
  onBrandChange: (value: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
}

export function GlobalCatalogFilters({
  searchQuery,
  onSearchChange,
  industryCategories,
  selectedIndustryCategories,
  onIndustryCategoriesChange,
  brands,
  selectedBrand,
  onBrandChange,
  viewMode,
  onViewModeChange,
}: GlobalCatalogFiltersProps) {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");

  // Verificar si hay filtros activos
  const hasIndustryCategoryFilter = selectedIndustryCategories.length > 0;
  const hasBrandFilter = selectedBrand !== "all";

  const hasAnyFilter = hasIndustryCategoryFilter || hasBrandFilter;
  const activeFiltersCount =
    (hasIndustryCategoryFilter ? 1 : 0) + (hasBrandFilter ? 1 : 0);

  // Handler para limpiar todos los filtros
  const handleClearFilters = () => {
    onIndustryCategoriesChange([]);
    onBrandChange("all");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Buscador estilo órdenes */}
      <div className="flex items-center bg-white rounded-card px-4 py-2.5 w-full sm:w-auto sm:min-w-64 border border-slate-200">
        <Search className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
        <input
          type="text"
          placeholder={t("globalCatalog.search")}
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
              {tc("buttons.filter")}
            </h3>
            {hasAnyFilter && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {tc("buttons.clearAll")}
              </button>
            )}
          </div>

          <div className="p-4 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Filtro de Categoría Industrial */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                <FolderOpen className="w-3.5 h-3.5" />
                {t("globalCatalog.filters.category")}
              </h4>
              <MultiSelect
                options={industryCategories.map((ic) => ({
                  value: ic.id,
                  label: ic.name,
                }))}
                value={selectedIndustryCategories}
                onChange={onIndustryCategoriesChange}
                placeholder={t("globalCatalog.filters.category")}
                searchPlaceholder={tc("buttons.search")}
                emptyMessage={tc("empty.noResults")}
                maxDisplay={1}
                className="w-full"
              />
            </div>

            {/* Separador */}
            <div className="h-px bg-slate-100" />

            {/* Filtro de Marca */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" />
                {t("globalCatalog.filters.brand")}
              </h4>
              <Select value={selectedBrand} onValueChange={onBrandChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("globalCatalog.filters.brand")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tc("filters.all")}</SelectItem>
                  {brands
                    .filter((brand): brand is string => Boolean(brand))
                    .sort()
                    .map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
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

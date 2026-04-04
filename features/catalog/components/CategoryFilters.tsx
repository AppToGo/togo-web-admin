"use client";

/**
 * CategoryFilters Component
 *
 * Filtros para categorías con patrón popover similar a órdenes.
 * - Buscador nativo estilo órdenes (bg-white rounded-card + Search icon + X)
 * - Botón "Filtrar" con badge de conteo de filtros activos
 * - Popover con header (título + botón Limpiar condicional)
 * - Dentro del popover: Select de Estado, Select de Categoría Industrial
 */

import { useTranslations } from "next-intl";
import { Search, Filter, FolderOpen, X, CheckCircle2, XCircle } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import type { CategoryFilters as CategoryFiltersType } from "../types/catalog.types";

interface IndustryCategoryOption {
  id: string;
  name: string;
}

interface CategoryFiltersProps {
  filters: CategoryFiltersType;
  onFiltersChange: (filters: CategoryFiltersType) => void;
  industryCategories: IndustryCategoryOption[];
  activeFiltersCount: number;
  onClearFilters: () => void;
}

export function CategoryFilters({
  filters,
  onFiltersChange,
  industryCategories,
  activeFiltersCount,
  onClearFilters,
}: CategoryFiltersProps) {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");

  // Check if any filter is active
  const hasAnyFilter =
    filters.name || filters.isActive !== null || filters.industryCategoryId;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Buscador estilo órdenes */}
      <div className="flex items-center bg-white rounded-card px-4 py-2.5 w-full sm:w-auto sm:min-w-64 border border-slate-200">
        <Search className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
        <input
          type="text"
          placeholder={tc("search.placeholder")}
          value={filters.name}
          onChange={(e) =>
            onFiltersChange({ ...filters, name: e.target.value })
          }
          className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full"
        />
        {filters.name && (
          <button
            onClick={() => onFiltersChange({ ...filters, name: "" })}
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
                onClick={onClearFilters}
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
                {t("categories.industryCategory")}
              </h4>
              <Select
                value={filters.industryCategoryId || "all"}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    industryCategoryId: value === "all" ? "" : value,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t("categories.selectIndustryCategory")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tc("filters.all")}</SelectItem>
                  {industryCategories.map((ic) => (
                    <SelectItem key={ic.id} value={ic.id}>
                      {ic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Separador */}
            <div className="h-px bg-slate-100" />

            {/* Filtro de Estado - Switches */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                <FolderOpen className="w-3.5 h-3.5" />
                {tc("fields.status")}
              </h4>
              <div className="space-y-2">
                {/* Switch Activas */}
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-sm text-slate-700 group-hover:text-slate-900">
                      {tc("status.active")}
                    </span>
                  </div>
                  <Switch
                    checked={filters.isActive === true}
                    onCheckedChange={(checked) =>
                      onFiltersChange({
                        ...filters,
                        isActive: checked ? true : filters.isActive === false ? false : null,
                      })
                    }
                  />
                </label>

                {/* Switch Inactivas */}
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-slate-500" />
                    </div>
                    <span className="text-sm text-slate-700 group-hover:text-slate-900">
                      {tc("status.inactive")}
                    </span>
                  </div>
                  <Switch
                    checked={filters.isActive === false}
                    onCheckedChange={(checked) =>
                      onFiltersChange({
                        ...filters,
                        isActive: checked ? false : filters.isActive === true ? true : null,
                      })
                    }
                  />
                </label>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

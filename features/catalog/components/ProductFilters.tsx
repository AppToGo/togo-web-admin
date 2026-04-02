"use client";

/**
 * ProductFilters Component
 * 
 * Filtros extendidos para productos con selección de sede y estado de activación.
 * Solo muestra los filtros de sede cuando el negocio tiene múltiples sedes.
 * Todos los filtros en una sola línea responsive con flex-wrap.
 */

import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ViewToggle } from "@/components/ui/view-toggle";

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface Category {
  id: string;
  name: string;
}

interface ProductFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  categories: Category[];
  // Filtros HYBRID (opcionales)
  selectedBranchId?: string | null;
  onBranchChange?: (branchId: string | null) => void;
  activationStatus?: "activated" | "not_activated" | "all";
  onActivationStatusChange?: (status: "activated" | "not_activated" | "all") => void;
  branches?: Branch[];
  showBranchFilters?: boolean;
}

export function ProductFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  viewMode,
  onViewModeChange,
  categories,
  selectedBranchId,
  onBranchChange,
  activationStatus,
  onActivationStatusChange,
  branches = [],
  showBranchFilters = false,
}: ProductFiltersProps) {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder={t("products.search")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category Filter */}
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t("products.filters.categoryPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("products.filters.all")}</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder={t("products.filters.statusPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("products.filters.all")}</SelectItem>
          <SelectItem value="active">{tc("status.active")}</SelectItem>
          <SelectItem value="inactive">{tc("status.inactive")}</SelectItem>
        </SelectContent>
      </Select>

      {/* Branch Filter (condicional) */}
      {showBranchFilters && branches.length > 1 && (
        <Select
          value={selectedBranchId || "all"}
          onValueChange={(value) =>
            onBranchChange?.(value === "all" ? null : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("hybridFilters.selectBranch")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("hybridFilters.allBranches")}</SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Activation Status Filter (solo cuando hay sede seleccionada) */}
      {selectedBranchId && (
        <Select
          value={activationStatus || "all"}
          onValueChange={(value) =>
            onActivationStatusChange?.(value as "activated" | "not_activated" | "all")
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t("hybridFilters.activationStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("hybridFilters.allStatuses")}</SelectItem>
            <SelectItem value="activated">
              {t("hybridFilters.activated")}
            </SelectItem>
            <SelectItem value="not_activated">
              {t("hybridFilters.notActivated")}
            </SelectItem>
          </SelectContent>
        </Select>
      )}

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

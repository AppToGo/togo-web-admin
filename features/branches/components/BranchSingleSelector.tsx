"use client";

import { useMemo, useCallback } from "react";
import { Building2, Store, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useEffectiveBranches } from "@/features/branches/hooks";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export interface BranchSingleSelectorProps {
  value: string | null;
  onChange: (branchId: string | null) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Branch Single-Selector Component
 *
 * Selector de sucursales single-select para uso en filtros de productos.
 * - Muestra "Todas las sedes" cuando no hay selección
 * - Usa el hook useEffectiveBranches para centralizar la lógica
 */
export function BranchSingleSelector({
  value,
  onChange,
  placeholder,
  className,
}: BranchSingleSelectorProps) {
  const t = useTranslations("catalog");
  const tb = useTranslations("branches");

  // Usar hook centralizado para obtener sucursales efectivas
  const { 
    branches, 
    isLoading, 
    error,
    showBranchSelector,
  } = useEffectiveBranches();

  // Obtener el nombre de la sucursal seleccionada
  const selectedBranchName = useMemo(() => {
    if (!value) return placeholder || t("hybridFilters.allBranches");
    const branch = branches.find((b) => b.id === value);
    return branch?.name || t("hybridFilters.allBranches");
  }, [value, branches, placeholder, t]);

  // Verificar si está seleccionada una sucursal específica
  const hasSelection = value !== null;

  // Manejar selección
  const handleSelect = useCallback((branchId: string | null) => {
    onChange(branchId);
  }, [onChange]);

  // No renderizar si no debe mostrarse el selector (solo 1 sucursal o cargando permisos)
  if (!showBranchSelector && !isLoading) return null;

  // Estado de carga
  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center h-10 px-3 gap-2 rounded-md border border-slate-200 bg-slate-50 min-w-45",
          className
        )}
      >
        <Skeleton className="w-4 h-4 rounded" />
        <Skeleton className="w-24 h-4 rounded" />
        <Skeleton className="w-4 h-4 rounded ml-auto" />
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm",
          className
        )}
      >
        <Store className="w-4 h-4" />
        <span>{tb("errors.loadFailed")}</span>
      </div>
    );
  }

  // Sin sucursales disponibles
  if (branches.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-amber-600 text-sm",
          className
        )}
      >
        <Store className="w-4 h-4" />
        <span>{t("hybridFilters.noBranches")}</span>
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center h-10 px-3 gap-2 rounded-md border transition-colors min-w-45 text-left",
            hasSelection
              ? "border-indigo-200 bg-indigo-50 text-indigo-700"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
            className
          )}
        >
          <Building2 className={cn(
            "w-4 h-4 shrink-0",
            hasSelection ? "text-indigo-600" : "text-slate-500"
          )} />
          <span className="flex-1 truncate text-sm">{selectedBranchName}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50/50">
          <span className="text-xs font-medium text-slate-500">
            {t("hybridFilters.selectBranch")}
          </span>
        </div>

        {/* Lista de opciones */}
        <div className="max-h-64 overflow-y-auto">
          {/* Opción "Todas las sedes" */}
          <button
            onClick={() => handleSelect(null)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-slate-50",
              !hasSelection ? "bg-indigo-50 text-indigo-700" : "text-slate-700"
            )}
          >
            <div className={cn(
              "w-6 h-6 rounded flex items-center justify-center shrink-0",
              !hasSelection ? "bg-indigo-100" : "bg-slate-100"
            )}>
              <Store className={cn(
                "w-3.5 h-3.5",
                !hasSelection ? "text-indigo-600" : "text-slate-500"
              )} />
            </div>
            <span className="flex-1 text-left">{t("hybridFilters.allBranches")}</span>
            {!hasSelection && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
          </button>

          {/* Sucursales individuales */}
          {branches.map((branch) => {
            const isSelected = value === branch.id;
            return (
              <button
                key={branch.id}
                onClick={() => handleSelect(branch.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-slate-50",
                  isSelected ? "bg-indigo-50 text-indigo-700" : "text-slate-700"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded flex items-center justify-center shrink-0",
                  isSelected ? "bg-indigo-100" : "bg-slate-100"
                )}>
                  <Building2 className={cn(
                    "w-3.5 h-3.5",
                    isSelected ? "text-indigo-600" : "text-slate-500"
                  )} />
                </div>
                <span className="flex-1 text-left truncate">{branch.name}</span>
                {branch.isMainBranch && (
                  <Badge
                    variant="outline"
                    className="text-[10px] h-5 px-1.5 text-amber-600 border-amber-200 bg-amber-50 shrink-0"
                  >
                    {tb("main")}
                  </Badge>
                )}
                {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

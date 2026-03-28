"use client";

import { useEffect, useMemo, useCallback } from "react";
import { Building2, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useEffectiveBranches } from "@/features/branches/hooks";
import { useBranchStore } from "@/stores/branch.store";
import { MultiSelector } from "@/components/ui/multi-selector";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export interface BranchMultiSelectorProps {
  className?: string;
  onSelectionChange?: (branchIds: string[]) => void;
}

/**
 * Branch Multi-Selector Component
 *
 * Selector de sucursales multi-select que funciona para:
 * - SUPER_ADMIN: Carga sucursales del negocio seleccionado
 * - Usuarios normales: Usa sucursales de su sesión
 * 
 * Usa el hook useEffectiveBranches para centralizar la lógica.
 */
export function BranchMultiSelector({
  className,
  onSelectionChange,
}: BranchMultiSelectorProps) {
  const t = useTranslations("orders");
  const tb = useTranslations("branches");

  // Usar hook centralizado para obtener sucursales efectivas
  const { 
    branches, 
    defaultBranchId,
    isLoading, 
    error,
    showBranchSelector,
  } = useEffectiveBranches();

  const selectedBranchIds = useBranchStore((state) => state.selectedBranchIds);
  const setSelectedBranches = useBranchStore(
    (state) => state.setSelectedBranches
  );

  // Convertir sucursales a opciones del MultiSelector
  const branchOptions = useMemo(
    () =>
      branches.map((b) => ({
        value: b.id,
        label: b.name,
        badge: b.isMainBranch ? (
          <Badge
            variant="outline"
            className="text-[10px] h-5 text-amber-600 border-amber-200 bg-amber-50"
          >
            {tb("main")}
          </Badge>
        ) : undefined,
      })),
    [branches, tb]
  );

  // Manejar cambios de selección
  const handleChange = useCallback(
    (values: string[]) => {
      const names = values.reduce(
        (acc, id) => {
          const branch = branches.find((b) => b.id === id);
          if (branch) acc[id] = branch.name;
          return acc;
        },
        {} as Record<string, string>
      );
      setSelectedBranches(values, names);
      onSelectionChange?.(values);
    },
    [branches, setSelectedBranches, onSelectionChange]
  );

  // Inicializar selección al montar - respeta defaultBranchId
  useEffect(() => {
    if (isLoading || !branches.length) return;

    // Si ya hay selección válida, validarla
    if (selectedBranchIds.length > 0) {
      const validIds = selectedBranchIds.filter((id) =>
        branches.some((b) => b.id === id)
      );
      if (validIds.length !== selectedBranchIds.length) {
        // Limpiar selección inválida
        const validNames = validIds.reduce(
          (acc, id) => {
            const branch = branches.find((b) => b.id === id);
            if (branch) acc[id] = branch.name;
            return acc;
          },
          {} as Record<string, string>
        );
        setSelectedBranches(validIds, validNames);
      }
      return;
    }

    // Sin selección previa - usar defaultBranchId si existe
    if (defaultBranchId) {
      const hasAccess = branches.some((b) => b.id === defaultBranchId);
      if (hasAccess) {
        const defaultBranch = branches.find((b) => b.id === defaultBranchId);
        setSelectedBranches(
          [defaultBranchId],
          defaultBranch ? { [defaultBranchId]: defaultBranch.name } : {}
        );
        return;
      }
    }

    // Fallback: seleccionar primera sucursal
    if (branches.length > 0) {
      const firstBranch = branches[0];
      setSelectedBranches(
        [firstBranch.id],
        { [firstBranch.id]: firstBranch.name }
      );
    }
  }, [isLoading, branches, defaultBranchId, selectedBranchIds, setSelectedBranches]);

  // No renderizar si no debe mostrarse el selector
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

  // Sin sucursales disponibles (SUPER_ADMIN sin negocio seleccionado)
  if (branches.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-amber-600 text-sm",
          className
        )}
      >
        <Store className="w-4 h-4" />
        <span>{t("branchSelector.selectBusinessFirst")}</span>
      </div>
    );
  }

  return (
    <MultiSelector
      options={branchOptions}
      value={selectedBranchIds}
      onChange={handleChange}
      placeholder={t("branchSelector.placeholder")}
      searchPlaceholder={t("branchSelector.searchPlaceholder")}
      emptyMessage={t("branchSelector.noResults")}
      allLabel={t("branchSelector.allBranches")}
      clearAllLabel={t("branchSelector.clearAll")}
      selectAllLabel={t("branchSelector.selectAll")}
      icon={<Building2 className="w-4 h-4" />}
      className={className}
      showSelectAll
      showFooter
    />
  );
}

/**
 * Branch Filter Badge
 */
export function BranchFilterBadge({ count }: { count: number }) {
  const t = useTranslations("orders");

  if (count === 0) return null;

  return (
    <Badge
      variant="secondary"
      className="h-6 px-2 gap-1 bg-indigo-50 text-indigo-700 border-indigo-100"
    >
      <Building2 className="w-3 h-3" />
      <span className="text-xs">
        {count === 1
          ? t("branchSelector.oneBranch")
          : t("branchSelector.multipleBranches", { count })}
      </span>
    </Badge>
  );
}

"use client";

import { useEffect, useMemo } from "react";
import { Building2, ChevronDown, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useBranches, useCanCreateBranch, useSelectedBranch } from "@/features/branches/hooks";
import { useBranchStore } from "@/stores/branch.store";
import type { Branch } from "@/features/branches/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Branch Selector Component
 *
 * Selector global de sucursales para el dashboard header.
 * - Muestra la sucursal actualmente seleccionada
 * - Permite cambiar entre sucursales disponibles
 * - Guarda la selección en localStorage (key: 'togo-selected-branch')
 * - Para planes BASIC (solo 1 sucursal), muestra como display estático
 */
export function BranchSelector() {
  const t = useTranslations("branches");
  
  const { data: branches, isLoading: isLoadingBranches } = useBranches();
  const { data: canCreateData, isLoading: isLoadingCanCreate } = useCanCreateBranch();
  const { 
    selectedBranchId, 
    selectedBranchName, 
    setSelectedBranch, 
    clearSelectedBranch 
  } = useBranchStore();

  // Determinar si el plan permite múltiples sucursales
  const isMultiBranch = useMemo(() => {
    if (isLoadingCanCreate || !canCreateData) return null;
    return canCreateData.max > 1;
  }, [canCreateData, isLoadingCanCreate]);

  // Encontrar la sucursal seleccionada
  const selectedBranch = useMemo(() => {
    if (!branches) return null;
    return branches.find((b: Branch) => b.id === selectedBranchId);
  }, [branches, selectedBranchId]);

  // Seleccionar automáticamente la primera sucursal si no hay selección
  useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranchId) {
      // Priorizar la sucursal principal
      const mainBranch = branches.find((b: Branch) => b.isMainBranch);
      const branchToSelect = mainBranch || branches[0];
      setSelectedBranch(branchToSelect.id, branchToSelect.name);
    }
  }, [branches, selectedBranchId, setSelectedBranch]);

  // Limpiar selección si no hay sucursales
  useEffect(() => {
    if (branches && branches.length === 0 && selectedBranchId) {
      clearSelectedBranch();
    }
  }, [branches, selectedBranchId, clearSelectedBranch]);

  // Manejar cambio de sucursal
  const handleBranchChange = (branchId: string) => {
    const branch = branches?.find((b: Branch) => b.id === branchId);
    if (branch) {
      setSelectedBranch(branch.id, branch.name);
    }
  };

  // Estado de carga
  if (isLoadingBranches || isLoadingCanCreate) {
    return <BranchSelectorSkeleton />;
  }

  // Sin sucursales
  if (!branches || branches.length === 0) {
    return (
      <div className="px-3 py-2">
        <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-card bg-slate-50/60 border border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 mb-0.5">{t("branch")}</p>
            <p className="text-sm font-medium text-slate-400 truncate">
              {t("noBranches")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Plan BASIC: Solo mostrar la sucursal sin selector
  if (isMultiBranch === false) {
    const branch = branches[0];
    return (
      <div className="px-3 py-2">
        <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-card bg-white/60 border border-white/40">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 mb-0.5">{t("branch")}</p>
            <p className="text-sm font-medium text-slate-800 truncate" title={branch.name}>
              {branch.name}
            </p>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {t("singleBranch")}
          </span>
        </div>
      </div>
    );
  }

  // Plan con múltiples sucursales: Selector dropdown
  return (
    <div className="px-3 py-2">
      <Select
        value={selectedBranchId || ""}
        onValueChange={handleBranchChange}
      >
        <SelectTrigger 
          variant="ghost" 
          className="w-full h-auto p-0 border-0 bg-transparent shadow-none hover:bg-transparent focus:ring-0"
        >
          <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-card bg-white/60 border border-white/40 hover:bg-white/80 transition-all duration-200 text-left">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 mb-0.5">{t("branch")}</p>
              <SelectValue placeholder={t("selectBranch")}>
                <p className="text-sm font-medium text-slate-800 truncate">
                  {selectedBranchName || selectedBranch?.name || t("selectBranch")}
                </p>
              </SelectValue>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
        </SelectTrigger>
        <SelectContent align="start" className="w-64">
          {branches.map((branch: Branch) => (
            <SelectItem
              key={branch.id}
              value={branch.id}
              className={cn(
                "cursor-pointer",
                selectedBranchId === branch.id && "bg-indigo-50 text-indigo-700"
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    branch.isActive ? "bg-emerald-400" : "bg-slate-300"
                  )}
                />
                <span className="truncate">{branch.name}</span>
                {branch.isMainBranch && (
                  <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {t("main")}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Skeleton loader for Branch Selector
 */
function BranchSelectorSkeleton() {
  return (
    <div className="px-3 py-2">
      <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-card bg-slate-50/60 border border-slate-100">
        <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
        <div className="flex-1 min-w-0">
          <Skeleton className="w-12 h-3 mb-1" />
          <Skeleton className="w-24 h-4" />
        </div>
        <Skeleton className="w-4 h-4 shrink-0" />
      </div>
    </div>
  );
}

/**
 * Compact Branch Selector for Header
 * 
 * Versión compacta para usar en el header del dashboard.
 * Muestra solo el icono y nombre en un dropdown.
 */
export function BranchSelectorCompact() {
  const t = useTranslations("branches");
  const { data: branches, isLoading } = useBranches();
  const { data: canCreateData } = useCanCreateBranch();
  const { selectedBranchId, selectedBranchName, setSelectedBranch } = useBranchStore();

  const isMultiBranch = useMemo(() => {
    if (!canCreateData) return false;
    return canCreateData.max > 1;
  }, [canCreateData]);

  const selectedBranch = useMemo(() => {
    if (!branches) return null;
    return branches.find((b: Branch) => b.id === selectedBranchId);
  }, [branches, selectedBranchId]);

  // Auto-select first branch
  useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranchId) {
      const mainBranch = branches.find((b: Branch) => b.isMainBranch);
      const branchToSelect = mainBranch || branches[0];
      setSelectedBranch(branchToSelect.id, branchToSelect.name);
    }
  }, [branches, selectedBranchId, setSelectedBranch]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5">
        <Skeleton className="w-4 h-4" />
        <Skeleton className="w-20 h-4" />
      </div>
    );
  }

  if (!branches || branches.length === 0) {
    return null;
  }

  // Single branch: just display
  if (!isMultiBranch) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600">
        <Building2 className="w-4 h-4 text-slate-400" />
        <span className="truncate max-w-[120px]">{branches[0]?.name}</span>
      </div>
    );
  }

  // Multi branch: dropdown
  return (
    <Select value={selectedBranchId || ""} onValueChange={(id) => {
      const branch = branches?.find((b: Branch) => b.id === id);
      if (branch) setSelectedBranch(branch.id, branch.name);
    }}>
      <SelectTrigger 
        variant="ghost" 
        className="h-8 px-2 gap-2 text-sm text-slate-600 hover:text-slate-900 border-0"
      >
        <Building2 className="w-4 h-4 text-slate-400" />
        <span className="truncate max-w-[120px]">
          {selectedBranchName || selectedBranch?.name || t("selectBranch")}
        </span>
      </SelectTrigger>
      <SelectContent align="end">
        {branches.map((branch: Branch) => (
          <SelectItem key={branch.id} value={branch.id} className="text-sm">
            <div className="flex items-center gap-2">
              <span className="truncate">{branch.name}</span>
              {branch.isMainBranch && (
                <span className="text-xs text-slate-400">({t("main")})</span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Branch Badge Component
 * 
 * Muestra un badge simple con el nombre de la sucursal seleccionada.
 * Útil para indicadores en el header.
 */
export function BranchBadge() {
  const { data: branches } = useBranches();
  const selectedBranchId = useBranchStore((state) => state.selectedBranchId);

  const selectedBranch = useMemo(() => {
    if (!branches || !selectedBranchId) return null;
    return branches.find((b: Branch) => b.id === selectedBranchId);
  }, [branches, selectedBranchId]);

  if (!selectedBranch) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
      <Store className="w-3 h-3" />
      <span className="truncate max-w-[100px]">{selectedBranch.name}</span>
    </div>
  );
}

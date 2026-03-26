/**
 * Branches Hooks
 *
 * Hooks para obtener datos de sucursales usando TanStack Query.
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useBusinessStore } from "@/features/business/stores/business.store";
import { useBranchStore } from "@/stores/branch.store";
import {
  getBranches,
  getBranchById,
  canCreateBranch,
} from "../services/branch.service";
import { BRANCHES_KEYS, STALE_TIME, GC_TIME } from "./query-keys";
import type { Branch, CanCreateBranchResponse } from "../types";

/**
 * Hook para obtener todas las sucursales del negocio actual
 *
 * Solo se ejecuta cuando el usuario tiene un businessId válido
 * (ya sea del usuario autenticado o del negocio seleccionado por SUPER_ADMIN)
 */
export function useBranches() {
  const user = useAuthStore((state) => state.user);
  const { selectedBusinessId } = useBusinessStore();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const hasBusinessId = !!user?.businessId;
  const hasSelectedBusiness = !!selectedBusinessId;

  // Habilitar query si:
  // - Usuario normal con businessId asignado
  // - SUPER_ADMIN con un negocio seleccionado
  const isEnabled = isSuperAdmin ? hasSelectedBusiness : hasBusinessId;

  return useQuery<Branch[], Error>({
    queryKey: BRANCHES_KEYS.lists(),
    queryFn: getBranches,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: isEnabled,
    retry: (failureCount, error) => {
      // No reintentar en errores 401 o 403
      if (error instanceof Error) {
        const message = error.message;
        if (message.includes("401") || message.includes("403")) {
          return false;
        }
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook para obtener una sucursal específica por ID
 *
 * @param id - ID de la sucursal
 * @param enabled - Si la query está habilitada (default: true)
 */
export function useBranch(id: string | null, enabled: boolean = true) {
  return useQuery<Branch, Error>({
    queryKey: BRANCHES_KEYS.detail(id || ""),
    queryFn: () => getBranchById(id!),
    enabled: !!id && enabled,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Hook para verificar si se puede crear una nueva sucursal
 *
 * Verifica límites del plan y retorna información sobre capacidad disponible
 */
export function useCanCreateBranch() {
  const user = useAuthStore((state) => state.user);
  const { selectedBusinessId } = useBusinessStore();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const hasBusinessId = !!user?.businessId;
  const hasSelectedBusiness = !!selectedBusinessId;

  const isEnabled = isSuperAdmin ? hasSelectedBusiness : hasBusinessId;

  return useQuery<CanCreateBranchResponse, Error>({
    queryKey: BRANCHES_KEYS.canCreate(),
    queryFn: canCreateBranch,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: isEnabled,
    retry: (failureCount, error) => {
      if (error instanceof Error) {
        const message = error.message;
        if (message.includes("401") || message.includes("403")) {
          return false;
        }
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook para obtener la sucursal seleccionada con sus datos completos
 * Combina el store con la query de sucursales
 */
export function useSelectedBranch() {
  const { data: branches, isLoading } = useBranches();
  const selectedBranchId = useBranchStore((state) => state.selectedBranchId);

  const selectedBranch = useMemo(() => {
    if (!branches || !selectedBranchId) return null;
    return branches.find((b: Branch) => b.id === selectedBranchId);
  }, [branches, selectedBranchId]);

  return {
    branch: selectedBranch,
    isLoading,
    hasSelection: !!selectedBranchId,
  };
}

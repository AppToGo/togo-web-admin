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
  getBranchMetrics,
  type BranchMetrics,
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
 * Hook para obtener métricas de una sucursal específica
 */
export function useBranchMetrics(id: string | null | undefined) {
  return useQuery<BranchMetrics, Error>({
    queryKey: ["branch-metrics", id],
    queryFn: () => getBranchMetrics(id!),
    enabled: !!id,
    staleTime: 60 * 1000, // 60s
    gcTime: 5 * 60 * 1000,
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

/**
 * User Branch Assignment Info
 * Represents a branch with the user's role in that branch
 */
export interface UserBranchAssignment {
  id: string;
  name: string;
  role: string;
  isMainBranch: boolean;
}

/**
 * Business Info for multi-branch checks
 */
export interface BusinessInfo {
  maxBranches: number;
  currentBranches: number;
}

/**
 * Hook to get user branches with business info
 * Combines branches, business limits, and user role information
 * 
 * @returns Object containing branches, business info, loading state, and error state
 */
export function useUserBranches() {
  const user = useAuthStore((state) => state.user);
  const { data: branches, isLoading: isLoadingBranches, error: branchesError } = useBranches();
  const { data: canCreateData, isLoading: isLoadingCanCreate } = useCanCreateBranch();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isOwner = user?.role === "OWNER";
  const canSelectAll = isSuperAdmin || isOwner;
  
  // Default branch ID from user session
  const defaultBranchId = user?.operatorProfileId || null;

  // Business info derived from canCreateBranch response
  const businessInfo: BusinessInfo | null = useMemo(() => {
    if (!canCreateData) return null;
    return {
      maxBranches: canCreateData.max,
      currentBranches: canCreateData.current,
    };
  }, [canCreateData]);

  // Map branches to user branch assignments
  // For now, all branches have the user's role (future: could fetch specific assignments)
  const userBranches: UserBranchAssignment[] = useMemo(() => {
    if (!branches) return [];
    return branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      role: user?.role || "OPERATOR",
      isMainBranch: branch.isMainBranch,
    }));
  }, [branches, user?.role]);

  // Determine if multi-branch selection should be visible
  const isVisible = useMemo(() => {
    if (!businessInfo || !userBranches) return false;
    // Hidden if maxBranches === 1 (BASIC plan)
    if (businessInfo.maxBranches === 1) return false;
    // Hidden if only 1 branch assignment
    if (userBranches.length <= 1) return false;
    // Visible if maxBranches > 1 AND branches.length > 1
    return businessInfo.maxBranches > 1 && userBranches.length > 1;
  }, [businessInfo, userBranches]);

  const isLoading = isLoadingBranches || isLoadingCanCreate;
  const error = branchesError || null;

  return {
    branches: userBranches,
    businessInfo,
    userRole: user?.role || null,
    defaultBranchId,
    canSelectAll,
    isVisible,
    isLoading,
    error,
  };
}

/**
 * useEffectiveBranches Hook
 *
 * Hook reutilizable para cargar sucursales efectivas basado en el rol del usuario:
 * - SUPER_ADMIN: Carga sucursales del negocio seleccionado
 * - Usuarios normales: Usa sucursales de su sesión (useUserBranches)
 *
 * Este hook centraliza la lógica para evitar duplicación en componentes.
 */

import { useMemo, useCallback } from "react";
import { useIsSuperAdmin } from "@/features/auth/stores/auth.store";
import { useBusinessStore } from "@/features/business/stores/business.store";
import { useUserBranches } from "@/features/orders/hooks";
import { useBranchesByBusiness } from "./useBranches";

/**
 * Tipo normalizado para sucursales efectivas
 * Unifica Branch (de API) y UserBranch (de sesión)
 */
export interface EffectiveBranch {
  id: string;
  name: string;
  isMainBranch: boolean;
  role?: string | null;
}

export interface UseEffectiveBranchesReturn {
  /** Sucursales efectivas normalizadas */
  branches: EffectiveBranch[];
  /** ID de la sucursal por defecto (de preferencias de usuario) */
  defaultBranchId: string | null;
  /** Si está cargando las sucursales */
  isLoading: boolean;
  /** Error si ocurre */
  error: Error | null;
  /** Si debería mostrar el selector de sucursales (>1 sucursal) */
  showBranchSelector: boolean;
  /** Refetch de sucursales */
  refetch: () => Promise<unknown>;
}

/**
 * Normaliza un array de sucursales al tipo EffectiveBranch
 */
function normalizeBranches(
  branches: Array<{ id: string; name: string; isMainBranch: boolean; role?: string | null }>
): EffectiveBranch[] {
  return branches.map((b) => ({
    id: b.id,
    name: b.name,
    isMainBranch: b.isMainBranch,
    role: b.role ?? null,
  }));
}

/**
 * Hook para obtener sucursales efectivas basado en el rol del usuario
 * 
 * @returns Información de sucursales, loading states y utilidades
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { branches, isLoading, showBranchSelector, defaultBranchId } = useEffectiveBranches();
 *   
 *   if (isLoading) return <Loading />;
 *   
 *   return (
 *     <div>
 *       {showBranchSelector && <BranchMultiSelector />}
 *       <OrdersList branches={branches} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useEffectiveBranches(): UseEffectiveBranchesReturn {
  const isSuperAdmin = useIsSuperAdmin();
  
  // Para SUPER_ADMIN: obtener negocio seleccionado
  const { selectedBusinessId } = useBusinessStore();
  
  // Para usuarios normales: sucursales de su sesión
  const { 
    branches: userBranches, 
    defaultBranchId,
    isLoading: isLoadingUserBranches, 
    error: userError,
    refetch: refetchUserBranches 
  } = useUserBranches();
  
  // Para SUPER_ADMIN: cargar sucursales del negocio seleccionado
  const { 
    data: businessBranches, 
    isLoading: isLoadingBusinessBranches,
    error: businessError,
    refetch: refetchBusinessBranches
  } = useBranchesByBusiness(isSuperAdmin ? selectedBusinessId : null);
  
  // Normalizar y determinar valores efectivos basado en el rol
  const effectiveBranches = useMemo(() => {
    if (isSuperAdmin) {
      return normalizeBranches(businessBranches || []);
    }
    return normalizeBranches(userBranches);
  }, [isSuperAdmin, businessBranches, userBranches]);
  
  // Estados simples - no necesitan useMemo
  const isLoading = isSuperAdmin ? isLoadingBusinessBranches : isLoadingUserBranches;
  const error = isSuperAdmin ? businessError : userError;
  
  const showBranchSelector = effectiveBranches.length > 1;
  
  const refetch = useCallback(async () => {
    if (isSuperAdmin) {
      return refetchBusinessBranches();
    }
    return refetchUserBranches();
  }, [isSuperAdmin, refetchBusinessBranches, refetchUserBranches]);
  
  return {
    branches: effectiveBranches,
    defaultBranchId,
    isLoading,
    error,
    showBranchSelector,
    refetch,
  };
}

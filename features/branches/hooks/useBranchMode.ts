'use client';

import { useMemo } from 'react';
import { useBranches } from './useBranches';
import type { Branch } from '../types';

/**
 * Modo single branch - Una sola sede
 */
export interface SingleBranchMode {
  mode: 'SINGLE';
  /** La sede principal (o única) */
  mainBranch: Branch;
  /** Total de sedes */
  branchCount: 1;
}

/**
 * Modo multi branch - Múltiples sedes
 */
export interface MultiBranchMode {
  mode: 'MULTI';
  /** Todas las sedes */
  branches: Branch[];
  /** La sede principal */
  mainBranch: Branch;
  /** Total de sedes */
  branchCount: number;
}

/**
 * Hook para determinar el modo de sedes (SINGLE o MULTI)
 * 
 * SINGLE: 0 o 1 sedes - UI simplificada sin mencionar "sedes"
 * MULTI: 2+ sedes - UI completa con lista de sedes
 * 
 * @returns SingleBranchMode | MultiBranchMode | null (si está cargando)
 * 
 * @example
 * ```tsx
 * const branchMode = useBranchMode();
 * 
 * if (!branchMode) return <Loading />;
 * 
 * if (branchMode.mode === 'SINGLE') {
 *   return <SingleBranchSettings branch={branchMode.mainBranch} />;
 * }
 * 
 * return <BranchList branches={branchMode.branches} />;
 * ```
 */
export function useBranchMode(): SingleBranchMode | MultiBranchMode | null {
  const { data: branches, isLoading } = useBranches();

  return useMemo(() => {
    if (isLoading || !branches) return null;

    // Encontrar sede principal o usar la primera
    const mainBranch = branches.find((b: Branch) => b.isMainBranch) || branches[0];
    
    if (!mainBranch) return null;

    // Modo SINGLE: 0 o 1 sede
    if (branches.length <= 1) {
      return {
        mode: 'SINGLE',
        mainBranch,
        branchCount: 1,
      };
    }

    // Modo MULTI: 2+ sedes
    return {
      mode: 'MULTI',
      branches,
      mainBranch,
      branchCount: branches.length,
    };
  }, [branches, isLoading]);
}

/**
 * Hook que retorna solo la sede principal
 * Útil para cuando solo necesitas la sede principal sin importar el modo
 * 
 * @returns La sede principal o null
 */
export function useMainBranch(): Branch | null {
  const branchMode = useBranchMode();
  return branchMode?.mainBranch ?? null;
}

/**
 * Hook que retorna si estamos en modo multi-sede
 * 
 * @returns true si hay 2 o más sedes
 */
export function useIsMultiBranch(): boolean {
  const branchMode = useBranchMode();
  return branchMode?.mode === 'MULTI';
}

/**
 * Hook que retorna el número de sedes
 * 
 * @returns Número de sedes o 0 si está cargando
 */
export function useBranchCount(): number {
  const branchMode = useBranchMode();
  return branchMode?.branchCount ?? 0;
}

/**
 * Dashboard Branch Filter Store
 *
 * Store global para manejar el filtro de sede en el dashboard.
 * Permite filtrar métricas por una sede específica o todas las sedes.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  getEffectiveBusinessId,
  useEffectiveBusinessId,
} from '@/features/business/stores/business.store';

export interface BranchFilterState {
  selectedBranchId: string | null;
  /**
   * Negocio en que se eligió la sede. Un SUPER_ADMIN que cambia de negocio
   * no debe seguir filtrando por una sede del anterior (las métricas salían
   * vacías con "Todas las sedes" en el selector).
   */
  businessId: string | null;
}

export interface BranchFilterActions {
  setSelectedBranch: (branchId: string | null) => void;
  clearBranchFilter: () => void;
}

type BranchFilterStore = BranchFilterState & BranchFilterActions;

const initialState: BranchFilterState = {
  selectedBranchId: null,
  businessId: null,
};

/**
 * Dashboard Branch Filter Store
 *
 * Persiste la sede seleccionada en localStorage para mantener la preferencia
 * al recargar la página.
 */
export const useBranchFilterStore = create<BranchFilterStore>()(
  persist(
    (set) => ({
      ...initialState,

      /**
       * Establecer la sede seleccionada
       */
      setSelectedBranch: (branchId: string | null) => {
        set({ selectedBranchId: branchId, businessId: getEffectiveBusinessId() });
      },

      /**
       * Limpiar el filtro de sede (mostrar todas las sedes)
       */
      clearBranchFilter: () => {
        set(initialState);
      },
    }),
    {
      name: 'togo-dashboard-branch-filter',
      storage: createJSONStorage(() => localStorage),
      // v1 agrega `businessId`. Una sede guardada antes no sabe de qué
      // negocio es: se descarta (vuelve a "Todas las sedes") en vez de
      // aplicarla a cualquier negocio que elija el SUPER_ADMIN.
      version: 1,
      migrate: (persisted, version) =>
        version < 1 ? initialState : (persisted as BranchFilterState),
    }
  )
);

/**
 * Hook para obtener el ID de la sede seleccionada, solo si se eligió en el
 * negocio actual.
 */
export function useDashboardBranchId(): string | null {
  const businessId = useEffectiveBusinessId();
  return useBranchFilterStore((state) =>
    state.businessId === businessId ? state.selectedBranchId : null
  );
}

/**
 * Negocio de las estadísticas del dashboard: el del selector (SUPER_ADMIN)
 * o el propio. Con "Todos los negocios" (`""`) es undefined: las métricas
 * son de un negocio y no se consultan.
 */
export function useDashboardBusinessId(): string | undefined {
  return useEffectiveBusinessId() || undefined;
}

/**
 * Hook para obtener las acciones del store de filtro de sede
 */
export function useBranchFilterActions(): Pick<
  BranchFilterStore,
  'setSelectedBranch' | 'clearBranchFilter'
> {
  return useBranchFilterStore((state) => ({
    setSelectedBranch: state.setSelectedBranch,
    clearBranchFilter: state.clearBranchFilter,
  }));
}

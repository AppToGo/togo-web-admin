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
    }
  )
);

/**
 * Hook para obtener el ID de la sede seleccionada, solo si se eligió en el
 * negocio actual. Las selecciones guardadas antes del campo `businessId`
 * (llegan como null) se respetan: un usuario de negocio no cambia de negocio.
 */
export function useDashboardBranchId(): string | null {
  const businessId = useEffectiveBusinessId();
  return useBranchFilterStore((state) =>
    state.businessId === null || state.businessId === businessId
      ? state.selectedBranchId
      : null
  );
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

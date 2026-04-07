/**
 * Dashboard Branch Filter Store
 *
 * Store global para manejar el filtro de sede en el dashboard.
 * Permite filtrar métricas por una sede específica o todas las sedes.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface BranchFilterState {
  selectedBranchId: string | null;
}

export interface BranchFilterActions {
  setSelectedBranch: (branchId: string | null) => void;
  clearBranchFilter: () => void;
}

type BranchFilterStore = BranchFilterState & BranchFilterActions;

const initialState: BranchFilterState = {
  selectedBranchId: null,
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
        set({ selectedBranchId: branchId });
      },

      /**
       * Limpiar el filtro de sede (mostrar todas las sedes)
       */
      clearBranchFilter: () => {
        set({ selectedBranchId: null });
      },
    }),
    {
      name: 'togo-dashboard-branch-filter',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/**
 * Hook para obtener el ID de la sede seleccionada
 */
export function useDashboardBranchId(): string | null {
  return useBranchFilterStore((state) => state.selectedBranchId);
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

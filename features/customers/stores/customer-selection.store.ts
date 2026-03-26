/**
 * Customer Selection Store
 *
 * Store Zustand para manejar la selección múltiple de clientes.
 * - Persistencia en sessionStorage (se mantiene durante la sesión)
 * - Soporte para seleccionar todos los items de la página actual
 * - Soporte para seleccionar todos los items de todas las páginas
 *
 * Características:
 * - Persistencia en sessionStorage (se mantiene durante la sesión del browser)
 * - Acciones: toggle, selectAll, selectAllPages, clearSelection
 * - Selectores: selectedCount, hasSelection, isSelected
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CustomerSelectionState {
  selectedIds: Set<string>;
  isAllSelected: boolean;
  totalItems: number;
}

export interface CustomerSelectionActions {
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  selectAllPages: (totalItems: number) => void;
  clearSelection: () => void;
  setTotalItems: (total: number) => void;
  isSelected: (id: string) => boolean;
}

type CustomerSelectionStore = CustomerSelectionState & CustomerSelectionActions;

// Estado inicial
const initialState: CustomerSelectionState = {
  selectedIds: new Set(),
  isAllSelected: false,
  totalItems: 0,
};

/**
 * Customer Selection Store
 *
 * Persiste la selección en sessionStorage para mantenerla
 * durante la sesión del navegador.
 */
export const useCustomerSelectionStore = create<CustomerSelectionStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Alternar la selección de un cliente
       */
      toggleSelection: (id: string) => {
        set((state) => {
          const newSelectedIds = new Set(state.selectedIds);
          if (newSelectedIds.has(id)) {
            newSelectedIds.delete(id);
          } else {
            newSelectedIds.add(id);
          }
          return {
            selectedIds: newSelectedIds,
            isAllSelected: false, // Si se togglea individual, ya no es "todos"
          };
        });
      },

      /**
       * Seleccionar todos los IDs de la página actual
       */
      selectAll: (ids: string[]) => {
        set((state) => {
          const newSelectedIds = new Set(state.selectedIds);
          ids.forEach((id) => newSelectedIds.add(id));
          return {
            selectedIds: newSelectedIds,
            isAllSelected: false,
          };
        });
      },

      /**
       * Seleccionar todos los items de todas las páginas
       */
      selectAllPages: (totalItems: number) => {
        set({
          isAllSelected: true,
          totalItems,
        });
      },

      /**
       * Limpiar toda la selección
       */
      clearSelection: () => {
        set({
          selectedIds: new Set(),
          isAllSelected: false,
        });
      },

      /**
       * Establecer el total de items (para "seleccionar todos")
       */
      setTotalItems: (total: number) => {
        set({ totalItems: total });
      },

      /**
       * Verificar si un ID está seleccionado
       */
      isSelected: (id: string) => {
        const state = get();
        if (state.isAllSelected) return true;
        return state.selectedIds.has(id);
      },
    }),
    {
      name: "togo-customer-selection",
      storage: createJSONStorage(() => sessionStorage),
      // Transformar Set a Array para serialización
      partialize: (state) => ({
        selectedIds: Array.from(state.selectedIds),
        isAllSelected: state.isAllSelected,
        totalItems: state.totalItems,
      }),
      // Transformar Array a Set al rehidratar
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.selectedIds = new Set(state.selectedIds as unknown as string[]);
        }
      },
    }
  )
);

/**
 * Hook para obtener el conteo de seleccionados
 */
export function useSelectedCustomerCount(): number {
  return useCustomerSelectionStore((state) => {
    if (state.isAllSelected) return state.totalItems;
    return state.selectedIds.size;
  });
}

/**
 * Hook para verificar si hay alguna selección
 */
export function useHasCustomerSelection(): boolean {
  return useCustomerSelectionStore(
    (state) => state.isAllSelected || state.selectedIds.size > 0
  );
}

/**
 * Hook para verificar si un ID específico está seleccionado
 */
export function useIsCustomerSelected(id: string): boolean {
  return useCustomerSelectionStore((state) => {
    if (state.isAllSelected) return true;
    return state.selectedIds.has(id);
  });
}

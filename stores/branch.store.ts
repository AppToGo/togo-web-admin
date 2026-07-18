/**
 * Branch Store
 *
 * Store global para manejar las sucursales seleccionadas (multi-select).
 * Persiste la selección en localStorage para mantener la preferencia
 * al recargar la página.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { z } from "zod";

// Old schema for migration
const OldBranchStorageSchema = z.object({
  state: z.object({
    selectedBranchId: z.string().nullable(),
    selectedBranchName: z.string().nullable(),
  }),
});

// New schema for multi-select
const BranchStorageSchema = z.object({
  state: z.object({
    selectedBranchIds: z.array(z.string()),
    selectedBranchNames: z.record(z.string(), z.string()),
    selectAllBranches: z.boolean(),
  }),
});

interface BranchState {
  /** IDs de las sucursales seleccionadas */
  selectedBranchIds: string[];
  /** Mapa de nombres de sucursales (id -> name) */
  selectedBranchNames: Record<string, string>;
  /** Indica si todas las sucursales están seleccionadas */
  selectAllBranches: boolean;
}

interface BranchActions {
  /** Establecer la lista completa de sucursales seleccionadas */
  setSelectedBranches: (ids: string[], names: Record<string, string>) => void;
  /** Toggle selección de una sucursal */
  toggleBranchSelection: (branchId: string, name: string) => void;
  /** Seleccionar todas las sucursales */
  selectAllBranchesAction: (branchIds: string[]) => void;
  /** Deseleccionar todas las sucursales */
  deselectAllBranches: () => void;
  /** Verificar si una sucursal está seleccionada */
  isBranchSelected: (branchId: string) => boolean;
  /** Establecer modo "seleccionar todas" */
  setSelectAllBranches: (value: boolean) => void;
  /** 
   * Establecer una única sucursal seleccionada (legacy, para compatibilidad)
   * @deprecated Usar setSelectedBranches o toggleBranchSelection
   */
  setSelectedBranch: (id: string | null, name?: string | null) => void;
  /** Limpiar la selección (legacy, para compatibilidad) */
  clearSelectedBranch: () => void;
}

type BranchStore = BranchState & BranchActions;

const initialState: BranchState = {
  selectedBranchIds: [],
  selectedBranchNames: {},
  selectAllBranches: false,
};

/**
 * Branch Store
 *
 * Persiste las sucursales seleccionadas en localStorage con la clave 'togo-selected-branches-v2'.
 * Incluye migración automática desde el formato anterior ('togo-selected-branch').
 */
export const useBranchStore = create<BranchStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSelectedBranches: (ids: string[], names: Record<string, string>) => {
        set({
          selectedBranchIds: ids,
          selectedBranchNames: names,
          selectAllBranches: false,
        });
      },

      toggleBranchSelection: (branchId: string, name: string) => {
        const { selectedBranchIds, selectedBranchNames } = get();
        const isSelected = selectedBranchIds.includes(branchId);

        if (isSelected) {
          // Remove from selection
          const newIds = selectedBranchIds.filter((id) => id !== branchId);
          const newNames = { ...selectedBranchNames };
          delete newNames[branchId];
          set({
            selectedBranchIds: newIds,
            selectedBranchNames: newNames,
            selectAllBranches: false,
          });
        } else {
          // Add to selection
          set({
            selectedBranchIds: [...selectedBranchIds, branchId],
            selectedBranchNames: { ...selectedBranchNames, [branchId]: name },
            selectAllBranches: false,
          });
        }
      },

      selectAllBranchesAction: (branchIds: string[]) => {
        set({
          selectedBranchIds: branchIds,
          selectAllBranches: true,
        });
      },

      deselectAllBranches: () => {
        set({
          ...initialState,
        });
      },

      isBranchSelected: (branchId: string) => {
        const { selectedBranchIds, selectAllBranches } = get();
        return selectAllBranches || selectedBranchIds.includes(branchId);
      },

      setSelectAllBranches: (value: boolean) => {
        set({ selectAllBranches: value });
      },

      // Legacy compatibility methods
      setSelectedBranch: (id: string | null, name?: string | null) => {
        if (id) {
          set({
            selectedBranchIds: [id],
            selectedBranchNames: name ? { [id]: name } : {},
            selectAllBranches: false,
          });
        } else {
          set(initialState);
        }
      },

      clearSelectedBranch: () => {
        set(initialState);
      },
    }),
    {
      name: "togo-selected-branches-v2",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Migrate from old format
        if (typeof window === "undefined") return;

        const oldStorage = localStorage.getItem("togo-selected-branch");
        if (oldStorage) {
          try {
            const old = JSON.parse(oldStorage);
            const result = OldBranchStorageSchema.safeParse(old);

            if (result.success && state && result.data.state?.selectedBranchId) {
              const oldId = result.data.state.selectedBranchId;
              const oldName = result.data.state.selectedBranchName;

              state.selectedBranchIds = [oldId];
              state.selectedBranchNames = oldName ? { [oldId]: oldName } : {};
              state.selectAllBranches = false;

              // Clean up old storage after migration
              localStorage.removeItem("togo-selected-branch");
            }
          } catch {
            // Ignore parse errors
          }
        }
      },
    }
  )
);

/**
 * Hook para obtener los IDs de sucursales seleccionadas
 */
export function useSelectedBranchIds(): string[] {
  return useBranchStore((state) => state.selectedBranchIds);
}

/**
 * Hook para obtener el mapa de nombres de sucursales seleccionadas
 */
export function useSelectedBranchNames(): Record<string, string> {
  return useBranchStore((state) => state.selectedBranchNames);
}

/**
 * Hook para verificar si hay sucursales seleccionadas
 */
export function useHasSelectedBranches(): boolean {
  return useBranchStore(
    (state) => state.selectedBranchIds.length > 0 || state.selectAllBranches
  );
}

/**
 * Hook para verificar si una sucursal específica está seleccionada
 */
export function useIsBranchSelected(branchId: string): boolean {
  return useBranchStore(
    (state) =>
      state.selectAllBranches || state.selectedBranchIds.includes(branchId)
  );
}

/**
 * Hook para obtener el modo "seleccionar todas"
 */
export function useSelectAllBranches(): boolean {
  return useBranchStore((state) => state.selectAllBranches);
}

// ==================== Legacy Helpers (para compatibilidad) ====================

/**
 * Hook para obtener el branchId efectivo
 * @deprecated Usar useSelectedBranchIds para multi-select
 */
export function useSelectedBranchId(): string | null {
  return useBranchStore((state) => state.selectedBranchIds[0] ?? null);
}

/**
 * Hook para obtener el nombre de la sucursal seleccionada
 * @deprecated Usar useSelectedBranchNames para multi-select
 */
export function useSelectedBranchName(): string | null {
  return useBranchStore((state) => {
    const firstId = state.selectedBranchIds[0];
    return firstId ? state.selectedBranchNames[firstId] ?? null : null;
  });
}

/**
 * Hook para verificar si hay una sucursal seleccionada
 * @deprecated Usar useHasSelectedBranches para multi-select
 */
export function useHasSelectedBranch(): boolean {
  return useBranchStore(
    (state) => state.selectedBranchIds.length > 0 || state.selectAllBranches
  );
}

/**
 * Función helper para obtener el branch ID seleccionado
 * @deprecated Usar getSelectedBranchIds para multi-select
 */
export function getSelectedBranchId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem("togo-selected-branches-v2");
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    const result = BranchStorageSchema.safeParse(parsed);

    if (result.success) {
      return result.data.state.selectedBranchIds[0] ?? null;
    } else {
      // Datos corruptos, limpiar
      console.error(
        "[BranchStore] Datos corruptos en localStorage:",
        result.error
      );
      localStorage.removeItem("togo-selected-branches-v2");
    }
  } catch {
    // Error de parsing, limpiar
    localStorage.removeItem("togo-selected-branches-v2");
  }
  return null;
}

/**
 * Función helper para obtener todos los branch IDs seleccionados
 * Útil para usar fuera de componentes React
 */
export function getSelectedBranchIds(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem("togo-selected-branches-v2");
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    const result = BranchStorageSchema.safeParse(parsed);

    if (result.success) {
      return result.data.state.selectedBranchIds;
    } else {
      console.error(
        "[BranchStore] Datos corruptos en localStorage:",
        result.error
      );
      localStorage.removeItem("togo-selected-branches-v2");
    }
  } catch {
    localStorage.removeItem("togo-selected-branches-v2");
  }
  return [];
}

/**
 * Función helper para establecer el branch ID seleccionado
 * @deprecated Usar setSelectedBranchId del store para multi-select
 */
export function setSelectedBranchId(
  id: string | null,
  name?: string | null
): void {
  useBranchStore.getState().setSelectedBranch(id, name);
}

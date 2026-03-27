/**
 * Branch Store
 *
 * Store global para manejar la sucursal seleccionada (single) y sucursales seleccionadas (multi).
 * Persiste la selección en localStorage para mantener la preferencia
 * al recargar la página.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { z } from "zod";

// Schema Zod para validar datos del store en localStorage
const BranchStorageSchema = z.object({
  state: z.object({
    selectedBranchId: z.string().nullable(),
    selectedBranchName: z.string().nullable(),
    selectedBranchIds: z.array(z.string()).nullable(),
  }),
});

interface BranchState {
  /** ID de la sucursal seleccionada (single selection mode) */
  selectedBranchId: string | null;
  /** Nombre de la sucursal seleccionada (single selection mode) */
  selectedBranchName: string | null;
  /** IDs de las sucursales seleccionadas (multi selection mode) */
  selectedBranchIds: string[] | null;
}

interface BranchActions {
  /** Establecer la sucursal seleccionada (single) */
  setSelectedBranch: (id: string | null, name?: string | null) => void;
  /** Limpiar la selección (single) */
  clearSelectedBranch: () => void;
  /** Establecer las sucursales seleccionadas (multi) */
  setSelectedBranchIds: (ids: string[] | null) => void;
  /** Agregar una sucursal a la selección (multi) */
  addSelectedBranch: (id: string) => void;
  /** Remover una sucursal de la selección (multi) */
  removeSelectedBranch: (id: string) => void;
  /** Limpiar todas las selecciones (multi) */
  clearSelectedBranchIds: () => void;
  /** Seleccionar todas las sucursales disponibles (multi) */
  selectAllBranches: (allIds: string[]) => void;
}

type BranchStore = BranchState & BranchActions;

const initialState: BranchState = {
  selectedBranchId: null,
  selectedBranchName: null,
  selectedBranchIds: null,
};

/**
 * Branch Store
 *
 * Persiste la sucursal seleccionada en localStorage con la clave 'togo-selected-branch'.
 * Esto permite mantener la selección al recargar la página.
 */
export const useBranchStore = create<BranchStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSelectedBranch: (id: string | null, name?: string | null) => {
        set({
          selectedBranchId: id,
          selectedBranchName: name || null,
        });
      },

      clearSelectedBranch: () => {
        set({
          selectedBranchId: null,
          selectedBranchName: null,
        });
      },

      setSelectedBranchIds: (ids: string[] | null) => {
        set({
          selectedBranchIds: ids,
        });
      },

      addSelectedBranch: (id: string) => {
        const current = get().selectedBranchIds || [];
        if (!current.includes(id)) {
          set({
            selectedBranchIds: [...current, id],
          });
        }
      },

      removeSelectedBranch: (id: string) => {
        const current = get().selectedBranchIds || [];
        set({
          selectedBranchIds: current.filter((branchId) => branchId !== id),
        });
      },

      clearSelectedBranchIds: () => {
        set({
          selectedBranchIds: null,
        });
      },

      selectAllBranches: (allIds: string[]) => {
        set({
          selectedBranchIds: allIds,
        });
      },
    }),
    {
      name: "togo-selected-branch",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/**
 * Hook para obtener el branchId efectivo (single selection)
 * Combina el store con lógica de fallback si es necesario
 */
export function useSelectedBranchId(): string | null {
  return useBranchStore((state) => state.selectedBranchId);
}

/**
 * Hook para obtener el nombre de la sucursal seleccionada (single)
 */
export function useSelectedBranchName(): string | null {
  return useBranchStore((state) => state.selectedBranchName);
}

/**
 * Hook para obtener los IDs de sucursales seleccionadas (multi)
 */
export function useSelectedBranchIds(): string[] | null {
  return useBranchStore((state) => state.selectedBranchIds);
}

/**
 * Hook para verificar si hay una sucursal seleccionada (single)
 */
export function useHasSelectedBranch(): boolean {
  return useBranchStore((state) => !!state.selectedBranchId);
}

/**
 * Hook para verificar si hay sucursales seleccionadas (multi)
 */
export function useHasSelectedBranches(): boolean {
  return useBranchStore((state) => !!state.selectedBranchIds && state.selectedBranchIds.length > 0);
}

/**
 * Función helper para obtener el branch ID seleccionado (single)
 * Útil para usar fuera de componentes React
 */
export function getSelectedBranchId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem("togo-selected-branch");
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    const result = BranchStorageSchema.safeParse(parsed);

    if (result.success) {
      return result.data.state.selectedBranchId;
    } else {
      // Datos corruptos, limpiar
      console.error("[BranchStore] Datos corruptos en localStorage:", result.error);
      localStorage.removeItem("togo-selected-branch");
    }
  } catch {
    // Error de parsing, limpiar
    localStorage.removeItem("togo-selected-branch");
  }
  return null;
}

/**
 * Función helper para obtener los branch IDs seleccionados (multi)
 * Útil para usar fuera de componentes React
 */
export function getSelectedBranchIds(): string[] | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem("togo-selected-branch");
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    const result = BranchStorageSchema.safeParse(parsed);

    if (result.success) {
      return result.data.state.selectedBranchIds;
    } else {
      console.error("[BranchStore] Datos corruptos en localStorage:", result.error);
      localStorage.removeItem("togo-selected-branch");
    }
  } catch {
    localStorage.removeItem("togo-selected-branch");
  }
  return null;
}

/**
 * Función helper para establecer el branch ID seleccionado (single)
 * Útil para usar fuera de componentes React.
 * Delega en el store para mantener una única fuente de verdad.
 */
export function setSelectedBranchId(id: string | null, name?: string | null): void {
  useBranchStore.getState().setSelectedBranch(id, name);
}

/**
 * Función helper para establecer los branch IDs seleccionados (multi)
 * Útil para usar fuera de componentes React.
 */
export function setSelectedBranchIds(ids: string[] | null): void {
  useBranchStore.getState().setSelectedBranchIds(ids);
}

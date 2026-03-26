/**
 * Branch Store
 *
 * Store global para manejar la sucursal seleccionada.
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
  }),
});

interface BranchState {
  /** ID de la sucursal seleccionada */
  selectedBranchId: string | null;
  /** Nombre de la sucursal seleccionada (para mostrar en UI) */
  selectedBranchName: string | null;
}

interface BranchActions {
  /** Establecer la sucursal seleccionada */
  setSelectedBranch: (id: string | null, name?: string | null) => void;
  /** Limpiar la selección */
  clearSelectedBranch: () => void;
}

type BranchStore = BranchState & BranchActions;

const initialState: BranchState = {
  selectedBranchId: null,
  selectedBranchName: null,
};

/**
 * Branch Store
 *
 * Persiste la sucursal seleccionada en localStorage con la clave 'togo-selected-branch'.
 * Esto permite mantener la selección al recargar la página.
 */
export const useBranchStore = create<BranchStore>()(
  persist(
    (set) => ({
      ...initialState,

      setSelectedBranch: (id: string | null, name?: string | null) => {
        set({
          selectedBranchId: id,
          selectedBranchName: name || null,
        });
      },

      clearSelectedBranch: () => {
        set(initialState);
      },
    }),
    {
      name: "togo-selected-branch",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/**
 * Hook para obtener el branchId efectivo
 * Combina el store con lógica de fallback si es necesario
 */
export function useSelectedBranchId(): string | null {
  return useBranchStore((state) => state.selectedBranchId);
}

/**
 * Hook para obtener el nombre de la sucursal seleccionada
 */
export function useSelectedBranchName(): string | null {
  return useBranchStore((state) => state.selectedBranchName);
}

/**
 * Hook para verificar si hay una sucursal seleccionada
 */
export function useHasSelectedBranch(): boolean {
  return useBranchStore((state) => !!state.selectedBranchId);
}

/**
 * Función helper para obtener el branch ID seleccionado
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
 * Función helper para establecer el branch ID seleccionado
 * Útil para usar fuera de componentes React.
 * Delega en el store para mantener una única fuente de verdad.
 */
export function setSelectedBranchId(id: string | null, name?: string | null): void {
  useBranchStore.getState().setSelectedBranch(id, name);
}

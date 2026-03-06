/**
 * Business Store
 *
 * Store global para manejar el negocio seleccionado.
 * Para SUPER_ADMIN: Permite seleccionar cualquier negocio o "Todos"
 * Para usuarios normales: Usa el businessId del usuario autenticado
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface BusinessState {
  /** ID del negocio seleccionado. "" = Todos (solo SUPER_ADMIN), null = usar el del usuario */
  selectedBusinessId: string | null;
  /** Nombre del negocio seleccionado (para mostrar en UI) */
  selectedBusinessName: string | null;
}

interface BusinessActions {
  /** Establecer el negocio seleccionado */
  setSelectedBusiness: (id: string | null, name?: string | null) => void;
  /** Limpiar la selección (volver al negocio del usuario) */
  clearSelectedBusiness: () => void;
}

type BusinessStore = BusinessState & BusinessActions;

const initialState: BusinessState = {
  selectedBusinessId: null,
  selectedBusinessName: null,
};

/**
 * Business Store
 *
 * Persiste el negocio seleccionado en localStorage para mantener
 * la selección al recargar la página.
 */
export const useBusinessStore = create<BusinessStore>()(
  persist(
    (set) => ({
      ...initialState,

      setSelectedBusiness: (id: string | null, name?: string | null) => {
        set({
          selectedBusinessId: id,
          selectedBusinessName: name || null,
        });
      },

      clearSelectedBusiness: () => {
        set(initialState);
      },
    }),
    {
      name: "togo-selected-business",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/**
 * Hook para obtener el businessId efectivo
 * - SUPER_ADMIN con selección: usa el seleccionado
 * - SUPER_ADMIN sin selección: retorna "" (todos)
 * - Usuario normal: retorna null (usa el del auth store)
 */
export function useEffectiveBusinessId(): string | null {
  const { selectedBusinessId } = useBusinessStore();
  return selectedBusinessId;
}

/**
 * Hook para verificar si está seleccionado "Todos los negocios"
 * Solo aplica para SUPER_ADMIN
 */
export function useIsAllBusinessesSelected(): boolean {
  const { selectedBusinessId } = useBusinessStore();
  return selectedBusinessId === "";
}

/**
 * Date Filter Store
 *
 * Store global para manejar los filtros de fecha en toda la aplicación.
 * Sincroniza el período seleccionado entre Dashboard y Órdenes.
 *
 * Características:
 * - Persistencia en localStorage (se mantiene al recargar)
 * - Recálculo automático de fechas al rehidratar (para que "today" sea siempre hoy)
 * - Presets comunes: today, yesterday, week, last7days, month, custom
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type DateFilterPreset =
  | "today"
  | "yesterday"
  | "week"
  | "month"
  | "last7days"
  | "custom";

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

export interface DateFilterState {
  preset: DateFilterPreset;
  range: DateRange;
}

export interface DateFilterActions {
  setPreset: (preset: DateFilterPreset) => void;
  setCustomRange: (range: DateRange) => void;
  recalculateRange: () => void;
}

type DateFilterStore = DateFilterState & DateFilterActions;

/**
 * Helper: Formatear fecha a YYYY-MM-DD en zona horaria local
 */
function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Helper: Obtener fecha local de hoy
 */
function getToday(): Date {
  return new Date();
}

/**
 * Helper: Calcular rango desde preset
 */
function getRangeFromPreset(preset: DateFilterPreset): DateRange {
  const today = getToday();

  switch (preset) {
    case "today": {
      const todayStr = formatDate(today);
      return { from: todayStr, to: todayStr };
    }

    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yestStr = formatDate(yesterday);
      return { from: yestStr, to: yestStr };
    }

    case "week": {
      // Domingo de esta semana hasta hoy
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return { from: formatDate(weekStart), to: formatDate(today) };
    }

    case "last7days": {
      // Últimos 7 días incluyendo hoy
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 6);
      return { from: formatDate(last7), to: formatDate(today) };
    }

    case "month": {
      // Primer día del mes hasta hoy
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: formatDate(monthStart), to: formatDate(today) };
    }

    case "custom":
    default: {
      const defaultStr = formatDate(today);
      return { from: defaultStr, to: defaultStr };
    }
  }
}

// Estado inicial
const initialState: DateFilterState = {
  preset: "today",
  range: getRangeFromPreset("today"),
};

/**
 * Date Filter Store
 *
 * Persiste el preset seleccionado en localStorage.
 * Las fechas se recalculan automáticamente al cargar
 * para que "today" siempre sea el día actual.
 */
export const useDateFilterStore = create<DateFilterStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Establecer un preset predefinido
       * Calcula automáticamente el rango de fechas
       */
      setPreset: (preset: DateFilterPreset) => {
        set({ preset, range: getRangeFromPreset(preset) });
      },

      /**
       * Establecer un rango personalizado
       * Cambia el preset a "custom"
       */
      setCustomRange: (range: DateRange) => {
        set({ preset: "custom", range });
      },

      /**
       * Recalcular fechas basado en el preset actual
       * Útil al rehidratar para que "today" sea hoy real
       */
      recalculateRange: () => {
        const { preset } = get();
        if (preset !== "custom") {
          set({ range: getRangeFromPreset(preset) });
        }
      },
    }),
    {
      name: "togo-date-filter",
      storage: createJSONStorage(() => localStorage),
      // Solo persistimos el preset, las fechas se recalculan
      partialize: (state) => ({
        preset: state.preset,
        range: state.range,
      }),
      // Recalcular fechas al rehidratar
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Recalcular el rango si no es custom
          if (state.preset !== "custom") {
            state.range = getRangeFromPreset(state.preset);
          }
        }
      },
    }
  )
);

/**
 * Hook para obtener el rango de fechas actual
 */
export function useDateFilterRange(): DateRange {
  return useDateFilterStore((state) => state.range);
}

/**
 * Hook para obtener el preset actual
 */
export function useDateFilterPreset(): DateFilterPreset {
  return useDateFilterStore((state) => state.preset);
}

/**
 * Hook para obtener los setters del store
 */
export function useDateFilterActions(): Pick<
  DateFilterStore,
  "setPreset" | "setCustomRange" | "recalculateRange"
> {
  return useDateFilterStore((state) => ({
    setPreset: state.setPreset,
    setCustomRange: state.setCustomRange,
    recalculateRange: state.recalculateRange,
  }));
}

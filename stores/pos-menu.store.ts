/**
 * Submenú de Caja en la barra lateral.
 *
 * Las pestañas del POS (Vender, Por cobrar…) son estado interno de la
 * página, no rutas; por eso la página las registra acá y el Sidebar las
 * pinta como submenú de "Caja", igual que Catálogo. Sin registro (fuera de
 * Caja) el item vuelve a ser un link simple. No se persiste: al salir de
 * la página se limpia.
 */
import { create } from "zustand";

export interface PosMenuEntry {
  id: string;
  label: string;
  count?: number;
  active: boolean;
  onSelect: () => void;
}

interface PosMenuState {
  entries: PosMenuEntry[];
  setEntries: (entries: PosMenuEntry[]) => void;
  clearEntries: () => void;
}

export const usePosMenuStore = create<PosMenuState>()((set) => ({
  entries: [],
  setEntries: (entries) => set({ entries }),
  clearEntries: () => set({ entries: [] }),
}));

export interface PosSessionHeader {
  registerName: string;
  /** Estado ya formateado: "Abierta · {quién} · desde las {hora}". */
  statusText: string;
}

interface PosSessionHeaderState {
  header: PosSessionHeader | null;
  setHeader: (header: PosSessionHeader | null) => void;
  clearHeader: () => void;
}

/**
 * Caja abierta junto al título de la página: con turno abierto el título
 * deja de ser "Caja" y pasa a ser el nombre de la caja (con el punto
 * verde) y el subtítulo su estado. `CashPosPage` lo registra ya
 * formateado (la hora depende de la zona de la sede); sin turno abierto
 * es `null` y la página muestra sus textos de siempre.
 */
export const usePosSessionHeaderStore = create<PosSessionHeaderState>()(
  (set) => ({
    header: null,
    setHeader: (header) => set({ header }),
    clearHeader: () => set({ header: null }),
  })
);

export interface PosHeaderActions {
  onMovement: (() => void) | null;
  onCloseRegister: (() => void) | null;
  onOpenRegister: (() => void) | null;
}

interface PosHeaderActionsState {
  actions: PosHeaderActions | null;
  setActions: (actions: PosHeaderActions) => void;
  clearActions: () => void;
}

/**
 * Acciones de la caja (Movimiento, Cerrar/Abrir) para el título de la
 * página: viven en CashPosPage pero se pintan arriba junto a "Caja".
 */
export const usePosHeaderActionsStore = create<PosHeaderActionsState>()(
  (set) => ({
    actions: null,
    setActions: (actions) => set({ actions }),
    clearActions: () => set({ actions: null }),
  })
);

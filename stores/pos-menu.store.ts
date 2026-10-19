/**
 * Lo que la página de Caja pinta fuera de sí misma.
 *
 * Las pestañas del POS (Vender, Por cobrar…) son estado interno de la
 * página, no rutas; por eso `CashPosPage` las registra acá y el Sidebar las
 * pinta como submenú de "Caja", igual que Catálogo. Lo mismo con la caja
 * seleccionada (título de la página) y las acciones del turno (junto al
 * título). Se registra todo junto y solo cuando la caja está lista: sin
 * registro (cargando, sede sin cajas, fuera de Caja) el item del Sidebar
 * vuelve a ser un link simple y la página muestra sus textos de siempre.
 * No se persiste: al salir de la página se limpia.
 */
import { create } from "zustand";

export interface PosMenuEntry {
  id: string;
  label: string;
  count?: number;
  active: boolean;
  onSelect: () => void;
}

export interface PosRegisterHeader {
  registers: Array<{ id: string; name: string }>;
  selectedId: string;
  onSelectRegister: (id: string) => void;
  /** Turno abierto en la caja seleccionada (punto verde o gris). */
  isOpen: boolean;
  /**
   * Estado ya formateado: "Abierta · {quién} · desde las {hora}" o "Sin
   * turno abierto" (la hora depende de la zona de la sede).
   */
  statusText: string;
}

export interface PosHeaderActions {
  onMovement: (() => void) | null;
  onCloseRegister: (() => void) | null;
  onOpenRegister: (() => void) | null;
}

export interface PosPage {
  entries: PosMenuEntry[];
  header: PosRegisterHeader;
  actions: PosHeaderActions;
}

interface PosPageState {
  page: PosPage | null;
  setPage: (page: PosPage) => void;
  clearPage: () => void;
}

export const usePosPageStore = create<PosPageState>()((set) => ({
  page: null,
  setPage: (page) => set({ page }),
  clearPage: () => set({ page: null }),
}));

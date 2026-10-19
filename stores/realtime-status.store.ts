/**
 * Realtime Status Store
 *
 * Estado de conexión de los sockets globales del dashboard. Los sockets se
 * abren una sola vez en `DashboardRealtime` (layout del dashboard); las
 * páginas que muestran el indicador de conexión lo leen de acá en vez de
 * abrir su propio socket.
 */

import { create } from "zustand";

interface RealtimeStatusState {
  ordersConnected: boolean;
  conversationsConnected: boolean;
  setOrdersConnected: (value: boolean) => void;
  setConversationsConnected: (value: boolean) => void;
}

export const useRealtimeStatusStore = create<RealtimeStatusState>()((set) => ({
  ordersConnected: false,
  conversationsConnected: false,
  setOrdersConnected: (value) => set({ ordersConnected: value }),
  setConversationsConnected: (value) => set({ conversationsConnected: value }),
}));

export function useConversationsConnected(): boolean {
  return useRealtimeStatusStore((state) => state.conversationsConnected);
}

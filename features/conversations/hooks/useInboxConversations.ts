"use client";

import { useConversations } from "./useConversations";
import type { GetConversationsParams } from "../types";

/**
 * Lista de conversaciones para el inbox (Fase C, Etapa 3) — delega en
 * `useConversations` (Fase B), que ya soporta los filtros nuevos
 * (`control`, `assignedTo`, `status`, `hasUnread`, `q`). `limit` más alto
 * que el reporte de "sin pedido": el inbox no pagina, muestra la lista
 * completa de la pestaña activa.
 *
 * `isSocketConnected` activa un `refetchInterval` de respaldo: el
 * `QueryClient` global tiene `refetchOnWindowFocus:false`, así que sin
 * esto un socket caído dejaría la lista congelada sin que el operador se
 * entere (aparte del indicador de conexión en el header).
 */
export function useInboxConversations(
  filters: GetConversationsParams,
  isSocketConnected: boolean
) {
  return useConversations(
    {
      limit: 50,
      ...filters,
    },
    true,
    { refetchInterval: isSocketConnected ? false : 15000 }
  );
}

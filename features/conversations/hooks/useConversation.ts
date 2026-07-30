"use client";

import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useBusinessStore } from "@/features/business/stores/business.store";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import {
  getConversationById,
  getConversationByOrderId,
} from "../services/conversation.service";
import { CONVERSATIONS_KEYS, STALE_TIME, GC_TIME } from "./query-keys";
import type { ConversationDetail } from "../types";

function useEffectiveBusinessId(): string | undefined {
  const { selectedBusinessId } = useBusinessStore();
  const { user } = useAuthStore.getState();
  return selectedBusinessId || user?.businessId || undefined;
}

/**
 * Detalle de una conversación por sessionId — usado en el diálogo de hilo
 * de la sección de conversaciones en detalle de cliente.
 */
export function useConversation(
  sessionId: string | null,
  enabled: boolean = true
) {
  const effectiveBusinessId = useEffectiveBusinessId();

  return useQuery<ConversationDetail, Error>({
    queryKey: [
      ...CONVERSATIONS_KEYS.detail(sessionId || ""),
      effectiveBusinessId,
    ],
    queryFn: () => getConversationById(sessionId!, effectiveBusinessId),
    enabled: !!sessionId && enabled,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Detalle de la conversación vinculada a un pedido. `enabled` sólo debe ser
 * true cuando el tab "Conversación" está activo (ver
 * `OrderDetailContent`) — evita disparar la request para pedidos que nunca
 * tendrán conversación (catálogo web) mientras el tab no se visita.
 *
 * Un 404 (pedido sin `ConversationOrderLink`) se traduce acá a
 * `{ hasConversation: false }` en vez de propagarse como error — es un
 * estado válido del dominio, no una falla.
 */
export function useConversationByOrder(
  orderId: string | null,
  enabled: boolean = false
) {
  const effectiveBusinessId = useEffectiveBusinessId();

  const query = useQuery<ConversationDetail | null, Error>({
    queryKey: [...CONVERSATIONS_KEYS.byOrder(orderId || ""), effectiveBusinessId],
    queryFn: async () => {
      try {
        return await getConversationByOrderId(orderId!, effectiveBusinessId);
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!orderId && enabled,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: (failureCount, error) => {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401 || status === 403) return false;
      }
      return failureCount < 3;
    },
  });

  return {
    ...query,
    hasConversation: query.data !== null && query.data !== undefined,
  };
}

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { markConversationRead } from "../services/conversation-inbox.service";
import { CONVERSATIONS_KEYS } from "./query-keys";

/**
 * POST /:sessionId/read — marca `unreadCount=0` en el inbox. Silencioso
 * (sin toast): se dispara automáticamente al abrir un hilo, un error acá
 * no debe interrumpir al operador.
 */
export function useMarkConversationRead(sessionId: string) {
  const queryClient = useQueryClient();
  const businessId = useEffectiveBusinessId() ?? undefined;

  return useMutation({
    mutationFn: () => markConversationRead(sessionId, businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: [...CONVERSATIONS_KEYS.all, "summary"] });
    },
  });
}

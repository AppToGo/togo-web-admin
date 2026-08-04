"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CONVERSATIONS_KEYS } from "./query-keys";

/**
 * Invalidación compartida tras cualquier mutación del inbox que cambie el
 * estado visible de una conversación (control, asignación, nota, cierre):
 * detalle + lista + badges de resumen. Extraído para no repetir el mismo
 * bloque de 3 invalidaciones en cada hook de mutación.
 */
export function useInvalidateConversationQueries(sessionId: string, businessId?: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({
      queryKey: CONVERSATIONS_KEYS.detail(sessionId, businessId),
    });
    queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEYS.lists() });
    queryClient.invalidateQueries({ queryKey: [...CONVERSATIONS_KEYS.all, "summary"] });
  };
}

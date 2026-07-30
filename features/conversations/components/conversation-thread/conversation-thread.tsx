"use client";

import { useConversation } from "../../hooks/useConversation";
import { ConversationThreadView } from "./conversation-thread-view";

interface ConversationThreadProps {
  sessionId: string;
  className?: string;
}

/**
 * Componente de burbujas creado desde cero (no existe nada reutilizable
 * hoy) apoyado en `ScrollArea` y el hilo resuelto por `useConversation`.
 * Usado desde la sección de conversaciones en detalle de cliente, donde
 * sólo se conoce el `sessionId` (a diferencia de `OrderDetailContent`, que
 * ya trae el detalle completo vía `useConversationByOrder` y usa
 * `ConversationThreadView` directamente para no duplicar el fetch).
 */
export function ConversationThread({
  sessionId,
  className,
}: ConversationThreadProps) {
  const { data, isLoading } = useConversation(sessionId);

  return (
    <ConversationThreadView data={data} isLoading={isLoading} className={className} />
  );
}

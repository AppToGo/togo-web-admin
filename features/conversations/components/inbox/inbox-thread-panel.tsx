"use client";

import { useEffect } from "react";
import { useConversation } from "../../hooks/useConversation";
import { useMarkConversationRead } from "../../hooks/useMarkConversationRead";
import { useThreadAutoScroll } from "../../hooks/useThreadAutoScroll";
import { ConversationThreadView } from "../conversation-thread/conversation-thread-view";
import { InboxThreadHeader } from "./inbox-thread-header";
import { InboxNoteComposer } from "./inbox-note-composer";

interface InboxThreadPanelProps {
  sessionId: string;
}

export function InboxThreadPanel({ sessionId }: InboxThreadPanelProps) {
  const { data, isLoading } = useConversation(sessionId);
  const { mutate: markConversationRead } = useMarkConversationRead(sessionId);

  useEffect(() => {
    markConversationRead();
    // Solo debe repetirse al cambiar de conversación, no en cada
    // re-render que renueve la identidad de `markConversationRead`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Arranca al fondo y sigue los mensajes nuevos solo si ya estaba abajo.
  const scrollRef = useThreadAutoScroll(isLoading, data?.messages.length);

  return (
    <div className="flex h-full flex-col">
      {data && <InboxThreadHeader conversation={data} />}
      <div className="min-h-0 flex-1 overflow-hidden px-4 py-3">
        <ConversationThreadView
          ref={scrollRef}
          data={data}
          isLoading={isLoading}
          heightClassName="h-full"
        />
      </div>
      {data && <InboxNoteComposer conversation={data} />}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useConversation } from "../../hooks/useConversation";
import { useMarkConversationRead } from "../../hooks/useMarkConversationRead";
import { useThreadAutoScroll } from "../../hooks/useThreadAutoScroll";
import { ConversationThreadView } from "../conversation-thread/conversation-thread-view";
import { InboxThreadHeader } from "./inbox-thread-header";
import { InboxReplyBox } from "./inbox-reply-box";
import { InboxContextPanel } from "./inbox-context-panel";

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
    <>
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-card-xl border border-white/80 bg-white/45 backdrop-blur-xl">
        {data && <InboxThreadHeader conversation={data} />}
        <div className="min-h-0 flex-1 overflow-hidden px-5 py-4">
          <ConversationThreadView
            ref={scrollRef}
            data={data}
            isLoading={isLoading}
            heightClassName="h-full"
          />
        </div>
        {/* key: los borradores son de cada conversación, no pasan a la siguiente. */}
        {data && <InboxReplyBox key={data.id} conversation={data} />}
      </section>
      {/* Datos del cliente: solo con ancho de sobra (≥ xl). */}
      {data && <InboxContextPanel conversation={data} />}
    </>
  );
}

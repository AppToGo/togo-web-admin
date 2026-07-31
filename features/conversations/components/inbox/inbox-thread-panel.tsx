"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useConversation } from "../../hooks/useConversation";
import { useMarkConversationRead } from "../../hooks/useMarkConversationRead";
import { ConversationThreadView } from "../conversation-thread/conversation-thread-view";
import { InboxThreadHeader } from "./inbox-thread-header";
import { InboxNoteComposer } from "./inbox-note-composer";

interface InboxThreadPanelProps {
  sessionId: string;
}

/** Distancia al fondo (px) por debajo de la cual se considera "ya estaba abajo". */
const AUTO_SCROLL_THRESHOLD_PX = 80;

export function InboxThreadPanel({ sessionId }: InboxThreadPanelProps) {
  const { data, isLoading } = useConversation(sessionId);
  const { mutate: markConversationRead } = useMarkConversationRead(sessionId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wasAtBottomRef = useRef(true);

  useEffect(() => {
    markConversationRead();
    // Solo debe repetirse al cambiar de conversación, no en cada
    // re-render que renueve la identidad de `markConversationRead`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Sigue si el usuario está scrolleado cerca del fondo — sin esto, un
  // mensaje nuevo por WebSocket fuerza el scroll aunque el operador esté
  // revisando mensajes viejos más arriba.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      wasAtBottomRef.current =
        el.scrollHeight - el.scrollTop - el.clientHeight < AUTO_SCROLL_THRESHOLD_PX;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [isLoading]);

  // Al terminar de cargar el hilo (una vez por conversación, gracias al
  // `key={sessionId}` en la página), arranca siempre al fondo.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    wasAtBottomRef.current = true;
  }, [isLoading]);

  // Mensaje nuevo (propio o por WebSocket): solo sigue al fondo si ya
  // estaba ahí.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !wasAtBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [data?.messages.length]);

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

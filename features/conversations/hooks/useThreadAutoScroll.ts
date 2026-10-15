import { useEffect, useLayoutEffect, useRef } from "react";

/** Distancia al fondo (px) por debajo de la cual se considera "ya estaba abajo". */
const AUTO_SCROLL_THRESHOLD_PX = 80;

/**
 * Scroll de un hilo de mensajes: arranca al fondo al terminar de cargar y
 * sigue los mensajes nuevos solo si el operador ya estaba abajo — sin esto,
 * un mensaje nuevo por WebSocket fuerza el scroll aunque esté revisando
 * mensajes viejos más arriba.
 *
 * Pensado para montarse una vez por conversación (`key={sessionId}`).
 */
export function useThreadAutoScroll(isLoading: boolean, messageCount: number | undefined) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const wasAtBottomRef = useRef(true);

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

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    wasAtBottomRef.current = true;
  }, [isLoading]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !wasAtBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messageCount]);

  return scrollRef;
}

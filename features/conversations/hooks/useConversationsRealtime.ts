"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { APP_CONFIG } from "@/config/app.config";
import {
  isRefreshInProgress,
  waitForRefresh,
  startGlobalRefresh,
  clearGlobalRefreshState,
} from "@/services/auth-sync.service";
import { forceLogout } from "@/services/session.service";
import { createReconnectScheduler } from "@/lib/socket-reconnect";
import { CONVERSATIONS_KEYS } from "./query-keys";
import type { ConversationDetail, ConversationMessage } from "../types";

/**
 * Clon de `useOrdersRealtime` (features/orders/hooks/useOrdersRealtime.ts)
 * para el namespace `conversations` (Fase C, Etapa 3) — mismo mutex de
 * refresh, mismo gating (sin conectar si SUPER_ADMIN), mismo flag
 * `enableWebSockets`. Deliberadamente NO se generaliza en un hook
 * compartido: el patrón ya está duplicado una vez en el repo
 * (order.gateway / conversations.gateway en el backend) y una segunda
 * copia es más simple que una abstracción prematura sobre dos namespaces.
 */
const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace("/v1", "") ||
  "http://localhost:3000";

const WS_EVENTS = {
  MESSAGE: "conversation:message",
  STATUS: "conversation:status",
  CONTROL: "conversation:control",
  ASSIGNED: "conversation:assigned",
  NOTE: "conversation:note",
  CLOSED: "conversation:closed",
  REOPENED: "conversation:reopened",
  READ: "conversation:read",
  AUTH_ERROR: "auth_error",
} as const;

interface ConversationMessageEvent {
  businessId: string;
  sessionId: string;
  message: ConversationMessage;
  hasMedia: boolean;
  session: {
    lastMessageAt: string;
    messageCount: number;
    unreadCount: number;
    lastCustomerMessageAt: string | null;
  };
}

interface ConversationStatusEvent {
  sessionId: string;
  waMessageId: string;
  status: ConversationMessage["status"];
  errorCode: string | null;
}

interface ConversationSessionEvent {
  sessionId: string;
  [key: string]: unknown;
}

export interface ConversationsRealtimeState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

// Tope de reintentos consecutivos de auth_error antes de dejar de
// reconectar. Sin esto, un refresh que sigue devolviendo un token que el
// gateway rechaza (ej. condición de carrera con otro refresh que rota el
// refresh token de un solo uso) reintentaba para siempre — cada ciclo
// dispara un handshake nuevo, lo que en el browser mantiene el ícono de
// carga de la pestaña activo indefinidamente aunque la página ya haya
// terminado de renderizar.
const MAX_CONSECUTIVE_AUTH_FAILURES = 3;

export function useConversationsRealtime(
  enabled: boolean = true
): ConversationsRealtimeState {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const authFailureCountRef = useRef(0);

  const user = useAuthStore((state) => state.user);
  // A diferencia de `useOrdersRealtime` (su clon de origen), acá se usa
  // `useEffectiveBusinessId()` en vez de `selectedBusinessId || user?.businessId`:
  // ese último no ignora un `selectedBusinessId` obsoleto en localStorage que
  // no coincide con el negocio del usuario (ej. tras un cambio de cuenta),
  // lo que dejaría al socket escuchando en la room equivocada en silencio.
  const businessId = useEffectiveBusinessId();

  const getToken = useCallback(() => useAuthStore.getState().accessToken, []);

  const refreshAndReconnect = useCallback(
    async (socket: Socket) => {
      if (isRefreshInProgress()) {
        const token = await waitForRefresh();
        if (token) {
          socket.auth = { token, businessId };
          socket.connect();
        } else {
          socket.disconnect();
        }
        return;
      }

      const token = await startGlobalRefresh(async () => {
        try {
          const response = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
          });
          if (!response.ok) throw new Error("Token refresh failed");
          const data = await response.json();
          useAuthStore.getState().setAuthData(data);
          return { success: true, token: data.access_token };
        } catch (err) {
          return {
            success: false,
            token: null,
            error: err instanceof Error ? err : new Error("Refresh failed"),
          };
        }
      });

      if (token) {
        socket.auth = { token, businessId };
        socket.connect();
      } else {
        useAuthStore.getState().clearAuth();
        clearGlobalRefreshState();
        forceLogout("session_expired");
        socket.disconnect();
      }
    },
    [businessId]
  );

  const [state, setState] = useState<ConversationsRealtimeState>({
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  useEffect(() => {
    if (
      !enabled ||
      !APP_CONFIG.features.enableWebSockets ||
      !businessId ||
      !getToken() ||
      user?.role === "SUPER_ADMIN"
    ) {
      setState({ isConnected: false, isConnecting: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true }));

    // reconnection: false a propósito — la reconexión automática de
    // socket.io competía con refreshAndReconnect() de abajo: el servidor
    // emite 'auth_error' y LUEGO llama disconnect(true) (mismo evento que
    // dispara "io server disconnect" acá), así que un `socket.connect()`
    // inmediato en el handler de "disconnect" ganaba la carrera contra el
    // fetch de refresh (async, más lento) y reconectaba con el token
    // todavía viejo — reintentando para siempre con el mismo resultado.
    // Ahora la única reconexión es la manual, coordinada con el refresh.
    const socket = io(`${WS_URL}/conversations`, {
      auth: { token: getToken(), businessId },
      transports: ["websocket", "polling"],
      reconnection: false,
      timeout: 20000,
    });
    socketRef.current = socket;
    let handlingAuthError = false;
    let hasConnectedBefore = false;
    const reconnector = createReconnectScheduler(socket);

    socket.on("connect", () => {
      authFailureCountRef.current = 0;
      reconnector.reset();
      setState({ isConnected: true, isConnecting: false, error: null });
      // Los mensajes emitidos mientras el socket estuvo caído se perdieron.
      if (hasConnectedBefore) {
        queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEYS.all });
      }
      hasConnectedBefore = true;
    });
    socket.on("disconnect", (reason) => {
      setState({ isConnected: false, isConnecting: true, error: null });
      // El caso de auth ya lo maneja el handler de AUTH_ERROR — reconectar
      // acá también con el mismo token viejo es la carrera que causaba el
      // loop. "io client disconnect" es un corte nuestro (cleanup/logout).
      if (reason === "io client disconnect" || handlingAuthError) return;
      reconnector.schedule();
    });
    socket.on("connect_error", (error) => {
      setState({ isConnected: false, isConnecting: true, error: error.message });
      reconnector.schedule();
    });
    socket.on(WS_EVENTS.AUTH_ERROR, async ({ message }: { message: string }) => {
      if (message !== "token_expired") return;

      handlingAuthError = true;
      authFailureCountRef.current += 1;

      if (authFailureCountRef.current > MAX_CONSECUTIVE_AUTH_FAILURES) {
        setState({ isConnected: false, isConnecting: false, error: "reconnect_failed" });
        socket.disconnect();
        return;
      }

      await refreshAndReconnect(socket);
      handlingAuthError = false;
    });

    // El mensaje se appendea directo cuando no tiene adjunto (evita un
    // roundtrip); con adjunto se invalida el detalle para que el próximo
    // fetch traiga la URL firmada por MediaRefResolver, que el worker no
    // resuelve. Dedup con el optimistic update del composer: se busca por
    // waMessageId antes de appendear.
    socket.on(WS_EVENTS.MESSAGE, (event: ConversationMessageEvent) => {
      const key = CONVERSATIONS_KEYS.detail(event.sessionId, businessId ?? undefined);

      if (event.hasMedia) {
        queryClient.invalidateQueries({ queryKey: key });
      } else {
        queryClient.setQueryData<ConversationDetail>(key, (old) => {
          if (!old) return old;
          const existingIndex = old.messages.findIndex((m) => {
            if (m.waMessageId && m.waMessageId === event.message.waMessageId) {
              return true;
            }
            // Un envío que Meta rechazó persiste igual (fila FAILED, para
            // auditoría) con waMessageId null — el mismo valor que trae el
            // placeholder optimista del composer, así que el match de
            // arriba nunca alcanza para este caso. Sin este fallback, la
            // fila real se appendea al lado de la burbuja optimista en vez
            // de reemplazarla: mismo mensaje mostrado dos veces.
            return (
              !event.message.waMessageId &&
              !m.waMessageId &&
              m.id.startsWith("tmp-") &&
              m.senderUserId === event.message.senderUserId &&
              m.text === event.message.text
            );
          });
          const messages =
            existingIndex >= 0
              ? old.messages.map((m, i) => (i === existingIndex ? event.message : m))
              : [...old.messages, event.message];
          return {
            ...old,
            messages,
            messageCount: event.session.messageCount,
            lastMessageAt: event.session.lastMessageAt,
            unreadCount: event.session.unreadCount,
            lastCustomerMessageAt: event.session.lastCustomerMessageAt,
          };
        });
      }

      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEYS.lists() });
    });

    socket.on(WS_EVENTS.STATUS, (event: ConversationStatusEvent) => {
      const key = CONVERSATIONS_KEYS.detail(event.sessionId, businessId ?? undefined);
      queryClient.setQueryData<ConversationDetail>(key, (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: old.messages.map((m) =>
            m.waMessageId === event.waMessageId
              ? { ...m, status: event.status, errorCode: event.errorCode }
              : m
          ),
        };
      });
    });

    const invalidateSession = (event: ConversationSessionEvent) => {
      queryClient.invalidateQueries({
        queryKey: CONVERSATIONS_KEYS.detail(event.sessionId, businessId ?? undefined),
      });
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: [...CONVERSATIONS_KEYS.all, "summary"] });
    };

    socket.on(WS_EVENTS.CONTROL, invalidateSession);
    socket.on(WS_EVENTS.ASSIGNED, invalidateSession);
    socket.on(WS_EVENTS.NOTE, invalidateSession);
    socket.on(WS_EVENTS.CLOSED, invalidateSession);
    socket.on(WS_EVENTS.REOPENED, invalidateSession);
    socket.on(WS_EVENTS.READ, invalidateSession);

    return () => {
      reconnector.stop();
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setState({ isConnected: false, isConnecting: false, error: null });
    };
  }, [enabled, businessId, getToken, queryClient, refreshAndReconnect, user?.role]);

  return state;
}

"use client";

import { useState } from "react";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { isWindowOpen } from "../utils/conversation-window";
import { useSendConversationMessage } from "./useSendConversationMessage";
import { useAddConversationNote } from "./useAddConversationNote";
import type { ConversationDetail } from "../types";

/**
 * Qué puede hacer el composer de mensajes con esta conversación:
 * - `closed`: no está OPEN; el backend rechaza con SESSION_CLOSED aunque
 *   la ventana de 24h siga abierta.
 * - `windowExpired`: pasaron más de 24h desde el último mensaje del cliente.
 * - `heldByOther`: la atiende otro operador.
 * - `unassigned`: está en HUMAN pero sin nadie asignado (no se puede
 *   "tomar": el backend solo acepta takeover desde BOT o PENDING_HUMAN).
 * - `needsTakeover`: la atiende el bot o espera un asesor.
 * - `ready`: la tengo yo, se puede escribir.
 */
export type ComposerGate =
  | "closed"
  | "windowExpired"
  | "heldByOther"
  | "unassigned"
  | "needsTakeover"
  | "ready";

export function useComposerGate(conversation: ConversationDetail): ComposerGate {
  const user = useCurrentUser();

  if (conversation.status !== "OPEN") return "closed";
  if (!isWindowOpen(conversation.windowExpiresAt)) return "windowExpired";
  if (conversation.control !== "HUMAN") return "needsTakeover";
  if (!conversation.assignedUserId) return "unassigned";
  return conversation.assignedUserId === user?.userId ? "ready" : "heldByOther";
}

/**
 * Borrador de un mensaje al cliente. El texto se limpia al enviar (la
 * burbuja optimista ya lo muestra), pero si el envío falla vuelve al
 * textarea para no tener que reescribirlo.
 */
export function useMessageDraft(sessionId: string, initialText?: string) {
  const [text, setText] = useState(initialText ?? "");
  const sendMessage = useSendConversationMessage(sessionId);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || sendMessage.isPending) return;
    setText("");
    sendMessage.mutate(
      { text: trimmed },
      // Solo si no empezó otro borrador mientras tanto.
      { onError: () => setText((current) => current || trimmed) }
    );
  };

  return {
    text,
    setText,
    send,
    isPending: sendMessage.isPending,
    canSend: !!text.trim() && !sendMessage.isPending,
  };
}

/** Borrador de una nota interna: se limpia solo cuando se guardó. */
export function useNoteDraft(sessionId: string) {
  const [text, setText] = useState("");
  const addNote = useAddConversationNote(sessionId);

  const submit = (onSaved?: () => void) => {
    const trimmed = text.trim();
    if (!trimmed || addNote.isPending) return;
    addNote.mutate(
      { text: trimmed },
      {
        onSuccess: () => {
          setText("");
          onSaved?.();
        },
      }
    );
  };

  return {
    text,
    setText,
    submit,
    isPending: addNote.isPending,
    canSubmit: !!text.trim() && !addNote.isPending,
  };
}

/** Enter envía, Shift + Enter hace salto de línea. */
export function submitOnEnter(submit: () => void) {
  return (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };
}

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { getHumanizedErrorMessage } from "@/lib/error.utils";
import {
  sendConversationMessage,
  type SendMessageParams,
} from "../services/conversation-inbox.service";
import { CONVERSATIONS_KEYS } from "./query-keys";
import type { ConversationDetail, ConversationMessage } from "../types";

/**
 * Envío de texto desde el inbox (Fase C, Etapa 3), patrón de
 * `useUpdateOrderStatus` (features/orders/hooks/useOrders.ts): optimistic
 * update + rollback selectivo + toast.
 *
 * Dos comportamientos de error distintos, no un rollback genérico:
 * - 422 `OUTSIDE_24H_WINDOW`: rollback completo — el composer ya debería
 *   estar deshabilitado, este es sólo el cinturón de seguridad.
 * - 502 `PROVIDER_SEND_FAILED`: NO se hace rollback — la burbuja optimista
 *   se marca `FAILED` con el error, igual que hace WhatsApp Web con un
 *   mensaje que no salió (el usuario decide si reintenta, no desaparece).
 *
 * Dedup con el evento de realtime, por `waMessageId` — NUNCA por `id`.
 * El backend devuelve este 201 sin esperar la fila persistida
 * (`PersistingMessageAdapter.capture` es fire-and-forget, ver
 * `ConversationInboxService.sendMessage`), así que `result.id` es un
 * `randomUUID()` sintetizado en el momento que jamás coincide con el id
 * real que el job asíncrono le asigna a la fila en la base — el único
 * campo que sí es el mismo de un lado y del otro es `waMessageId` (el ID
 * que WhatsApp asigna al enviar, disponible en la respuesta síncrona del
 * provider).
 *
 * Por eso, si el WS gana la carrera contra la respuesta HTTP, el mensaje
 * real llega primero como una fila NUEVA (appendeada al final, ya que el
 * placeholder todavía tiene `waMessageId: null` y no matchea nada), y el
 * placeholder sigue vivo hasta que este `onSuccess` corre. `onSuccess`
 * filtra cualquier fila que ya comparta el `waMessageId` real (la que el
 * WS ya insertó) antes de reemplazar el placeholder por el DTO
 * sintetizado — sin este filtro por `waMessageId` (filtrar por `id` no
 * sirve, ver arriba) quedaban dos filas con el mismo `waMessageId` y
 * distinto `id` en pantalla.
 */
export function useSendConversationMessage(sessionId: string) {
  const queryClient = useQueryClient();
  const businessId = useEffectiveBusinessId() ?? undefined;
  const user = useCurrentUser();
  const t = useTranslations("inbox");

  return useMutation({
    mutationFn: (params: SendMessageParams) =>
      sendConversationMessage(sessionId, params, businessId),

    onMutate: async (params) => {
      const key = CONVERSATIONS_KEYS.detail(sessionId, businessId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ConversationDetail>(key);
      const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const optimisticMessage: ConversationMessage = {
        id: tempId,
        sessionId,
        direction: "OUTBOUND",
        senderType: "OPERATOR",
        senderUserId: user?.userId ?? null,
        operatorSource: "INBOX",
        contentType: "TEXT",
        text: params.text,
        media: null,
        interactive: null,
        waMessageId: null,
        replyToWaMessageId: params.replyToWaMessageId ?? null,
        relayOfMessageId: null,
        status: "QUEUED",
        statusUpdatedAt: null,
        errorCode: null,
        intent: null,
        confidence: null,
        fsmState: null,
        providerTimestamp: null,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<ConversationDetail>(key, (old) =>
        old ? { ...old, messages: [...old.messages, optimisticMessage] } : old
      );

      return { previous, tempId, key };
    },

    onError: (error, _params, context) => {
      if (!context) return;

      if (isAxiosError(error) && error.response?.status === 422) {
        if (context.previous) queryClient.setQueryData(context.key, context.previous);
        toast.error(t("composer.windowClosedError"));
        return;
      }

      queryClient.setQueryData<ConversationDetail>(context.key, (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: old.messages.map((m) =>
            m.id === context.tempId
              ? {
                  ...m,
                  status: "FAILED" as const,
                  errorCode: isAxiosError(error)
                    ? (error.response?.data as { providerCode?: string } | undefined)
                        ?.providerCode ?? null
                    : null,
                }
              : m
          ),
        };
      });
      toast.error(getHumanizedErrorMessage(error));
    },

    onSuccess: (result, _params, context) => {
      if (!context) return;
      queryClient.setQueryData<ConversationDetail>(context.key, (old) => {
        if (!old) return old;
        const messages = old.messages
          // Si el WS ya insertó el mensaje real (mismo waMessageId, id
          // distinto porque el suyo es el de la fila persistida), sacarlo
          // — se reemplaza el placeholder por `result` dos líneas abajo.
          .filter(
            (m) =>
              m.id === context.tempId ||
              !result.waMessageId ||
              m.waMessageId !== result.waMessageId
          )
          .map((m) => (m.id === context.tempId ? result : m));
        return { ...old, messages };
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEYS.lists() });
    },
  });
}

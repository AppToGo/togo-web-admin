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
 * Dedup con el evento de realtime: éste reemplaza el mensaje temporal por
 * el DTO real en `onSuccess`; si el evento de WebSocket llega primero,
 * `useConversationsRealtime` ya lo dedupea por `waMessageId` (que el
 * temporal nunca tiene, así que no colisiona).
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
        return {
          ...old,
          messages: old.messages.map((m) => (m.id === context.tempId ? result : m)),
        };
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEYS.lists() });
    },
  });
}

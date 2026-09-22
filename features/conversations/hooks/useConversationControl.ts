"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { getHumanizedErrorMessage } from "@/lib/error.utils";
import {
  takeoverConversation,
  releaseConversation,
  reopenConversation,
} from "../services/conversation-inbox.service";
import { useInvalidateConversationQueries } from "./useInvalidateConversationQueries";

/** POST /:sessionId/takeover — tomar el control. */
export function useTakeoverConversation(sessionId: string) {
  const businessId = useEffectiveBusinessId() ?? undefined;
  const invalidate = useInvalidateConversationQueries(sessionId, businessId);
  const t = useTranslations("inbox");

  return useMutation({
    mutationFn: () => takeoverConversation(sessionId, businessId),
    onSuccess: invalidate,
    onError: (error) => {
      toast.error(getHumanizedErrorMessage(error) || t("errors.takeoverFailed"));
    },
  });
}

/** POST /:sessionId/release — liberar el control (idempotente si ya está en BOT). */
export function useReleaseConversation(sessionId: string) {
  const businessId = useEffectiveBusinessId() ?? undefined;
  const invalidate = useInvalidateConversationQueries(sessionId, businessId);
  const t = useTranslations("inbox");

  return useMutation({
    mutationFn: (note?: string) => releaseConversation(sessionId, note, businessId),
    onSuccess: invalidate,
    onError: (error) => {
      toast.error(getHumanizedErrorMessage(error) || t("errors.releaseFailed"));
    },
  });
}

/**
 * POST /:sessionId/reopen — reabrir una conversación cerrada. El backend ya
 * manda mensajes legibles para los dos motivos de rechazo (ventana de 24h
 * vencida, o ya hay una conversación más nueva con este cliente), así que
 * no hace falta mapear códigos de error acá.
 */
export function useReopenConversation(sessionId: string) {
  const businessId = useEffectiveBusinessId() ?? undefined;
  const invalidate = useInvalidateConversationQueries(sessionId, businessId);
  const t = useTranslations("inbox");

  return useMutation({
    mutationFn: () => reopenConversation(sessionId, businessId),
    onSuccess: () => {
      invalidate();
      toast.success(t("actions.reopenedSuccess"));
    },
    onError: (error) => {
      toast.error(getHumanizedErrorMessage(error) || t("errors.reopenFailed"));
    },
  });
}

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { getHumanizedErrorMessage } from "@/lib/error.utils";
import {
  takeoverConversation,
  releaseConversation,
} from "../services/conversation-inbox.service";
import { CONVERSATIONS_KEYS } from "./query-keys";

function useInvalidateAfterControlChange(sessionId: string, businessId?: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({
      queryKey: CONVERSATIONS_KEYS.detail(sessionId, businessId),
    });
    queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEYS.lists() });
    queryClient.invalidateQueries({ queryKey: [...CONVERSATIONS_KEYS.all, "summary"] });
  };
}

/** POST /:sessionId/takeover — tomar el control. */
export function useTakeoverConversation(sessionId: string) {
  const businessId = useEffectiveBusinessId() ?? undefined;
  const invalidate = useInvalidateAfterControlChange(sessionId, businessId);
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
  const invalidate = useInvalidateAfterControlChange(sessionId, businessId);
  const t = useTranslations("inbox");

  return useMutation({
    mutationFn: (note?: string) => releaseConversation(sessionId, note, businessId),
    onSuccess: invalidate,
    onError: (error) => {
      toast.error(getHumanizedErrorMessage(error) || t("errors.releaseFailed"));
    },
  });
}

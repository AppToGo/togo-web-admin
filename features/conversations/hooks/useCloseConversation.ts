"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { getHumanizedErrorMessage } from "@/lib/error.utils";
import {
  closeConversation,
  type CloseConversationParams,
} from "../services/conversation-inbox.service";
import { CONVERSATIONS_KEYS } from "./query-keys";

/** POST /:sessionId/close — cerrar (idempotente si ya está cerrada). */
export function useCloseConversation(sessionId: string) {
  const queryClient = useQueryClient();
  const businessId = useEffectiveBusinessId() ?? undefined;
  const t = useTranslations("inbox");

  return useMutation({
    mutationFn: (params: CloseConversationParams = {}) =>
      closeConversation(sessionId, params, businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CONVERSATIONS_KEYS.detail(sessionId, businessId),
      });
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: [...CONVERSATIONS_KEYS.all, "summary"] });
      toast.success(t("actions.closedSuccess"));
    },
    onError: (error) => {
      toast.error(getHumanizedErrorMessage(error) || t("errors.closeFailed"));
    },
  });
}

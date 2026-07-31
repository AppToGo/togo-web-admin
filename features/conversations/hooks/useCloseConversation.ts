"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { getHumanizedErrorMessage } from "@/lib/error.utils";
import {
  closeConversation,
  type CloseConversationParams,
} from "../services/conversation-inbox.service";
import { useInvalidateConversationQueries } from "./useInvalidateConversationQueries";

/** POST /:sessionId/close — cerrar (idempotente si ya está cerrada). */
export function useCloseConversation(sessionId: string) {
  const businessId = useEffectiveBusinessId() ?? undefined;
  const invalidate = useInvalidateConversationQueries(sessionId, businessId);
  const t = useTranslations("inbox");

  return useMutation({
    mutationFn: (params: CloseConversationParams = {}) =>
      closeConversation(sessionId, params, businessId),
    onSuccess: () => {
      invalidate();
      toast.success(t("actions.closedSuccess"));
    },
    onError: (error) => {
      toast.error(getHumanizedErrorMessage(error) || t("errors.closeFailed"));
    },
  });
}

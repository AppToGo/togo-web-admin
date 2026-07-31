"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { getHumanizedErrorMessage } from "@/lib/error.utils";
import { assignConversation } from "../services/conversation-inbox.service";
import { useInvalidateConversationQueries } from "./useInvalidateConversationQueries";

/** PATCH /:sessionId/assignment — asignar (o desasignar con null). */
export function useAssignConversation(sessionId: string) {
  const businessId = useEffectiveBusinessId() ?? undefined;
  const invalidate = useInvalidateConversationQueries(sessionId, businessId);
  const t = useTranslations("inbox");

  return useMutation({
    mutationFn: (assignedUserId: string | null) =>
      assignConversation(sessionId, assignedUserId, businessId),
    onSuccess: invalidate,
    onError: (error) => {
      toast.error(getHumanizedErrorMessage(error) || t("errors.assignFailed"));
    },
  });
}

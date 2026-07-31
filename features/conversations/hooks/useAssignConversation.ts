"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { getHumanizedErrorMessage } from "@/lib/error.utils";
import { assignConversation } from "../services/conversation-inbox.service";
import { CONVERSATIONS_KEYS } from "./query-keys";

/** PATCH /:sessionId/assignment — asignar (o desasignar con null). */
export function useAssignConversation(sessionId: string) {
  const queryClient = useQueryClient();
  const businessId = useEffectiveBusinessId() ?? undefined;
  const t = useTranslations("inbox");

  return useMutation({
    mutationFn: (assignedUserId: string | null) =>
      assignConversation(sessionId, assignedUserId, businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CONVERSATIONS_KEYS.detail(sessionId, businessId),
      });
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: [...CONVERSATIONS_KEYS.all, "summary"] });
    },
    onError: (error) => {
      toast.error(getHumanizedErrorMessage(error) || t("errors.assignFailed"));
    },
  });
}

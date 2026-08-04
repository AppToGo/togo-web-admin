"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { getHumanizedErrorMessage } from "@/lib/error.utils";
import {
  addConversationNote,
  type AddNoteParams,
} from "../services/conversation-inbox.service";
import { CONVERSATIONS_KEYS } from "./query-keys";

/** POST /:sessionId/notes — nota interna, nunca se envía al cliente. */
export function useAddConversationNote(sessionId: string) {
  const queryClient = useQueryClient();
  const businessId = useEffectiveBusinessId() ?? undefined;
  const t = useTranslations("inbox");

  return useMutation({
    mutationFn: (params: AddNoteParams) => addConversationNote(sessionId, params, businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CONVERSATIONS_KEYS.detail(sessionId, businessId),
      });
    },
    onError: (error) => {
      toast.error(getHumanizedErrorMessage(error) || t("errors.noteFailed"));
    },
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { getConversationsSummary } from "../services/conversation.service";
import { CONVERSATIONS_KEYS, STALE_TIME } from "./query-keys";
import type { ConversationSummary } from "../types";

/** Badges de las pestañas del inbox (Esperando / Míos / Sin asignar). */
export function useInboxSummary(enabled: boolean = true) {
  const effectiveBusinessIdFromStore = useEffectiveBusinessId();
  const effectiveBusinessId = effectiveBusinessIdFromStore || undefined;

  return useQuery<ConversationSummary, Error>({
    queryKey: [...CONVERSATIONS_KEYS.all, "summary", effectiveBusinessId],
    queryFn: () => getConversationsSummary(effectiveBusinessId),
    enabled: !!effectiveBusinessId && enabled,
    staleTime: STALE_TIME,
  });
}

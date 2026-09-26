"use client";

import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { getConversationFunnel } from "../services/conversation-funnel.service";
import { CONVERSATIONS_KEYS, GC_TIME, STALE_TIME } from "./query-keys";
import type { ConversationFunnel, GetConversationFunnelParams } from "../types";

/**
 * Embudo conversacional del negocio seleccionado en el período (T20). Con
 * "Todos los negocios" (SUPER_ADMIN, `""`) la query queda apagada: el
 * endpoint es por negocio.
 */
export function useConversationFunnel(params: GetConversationFunnelParams) {
  const businessIdFromStore = useEffectiveBusinessId();
  const isAllBusinessesSelected = businessIdFromStore === "";
  const businessId = businessIdFromStore || undefined;

  const query = useQuery<ConversationFunnel, Error>({
    queryKey: CONVERSATIONS_KEYS.funnel(params, businessId),
    queryFn: () => getConversationFunnel(businessId!, params),
    enabled: !!businessId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: (failureCount, error) => {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401 || status === 403) return false;
      }
      return failureCount < 3;
    },
  });

  return { ...query, isAllBusinessesSelected };
}

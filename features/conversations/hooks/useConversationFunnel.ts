"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { getConversationFunnel } from "../services/conversation-funnel.service";
import { CONVERSATIONS_KEYS, GC_TIME, STALE_TIME, retryUnlessAuthError } from "./query-keys";
import type { ConversationFunnel, GetConversationFunnelParams } from "../types";

/**
 * Embudo conversacional del negocio seleccionado en el período (T20). Con
 * "Todos los negocios" (SUPER_ADMIN, `""`) la query queda apagada: el
 * endpoint es por negocio.
 *
 * `options.businessId` fija el negocio en vez de tomarlo del selector: el
 * dashboard lo usa para que la tarjeta del bot muestre el mismo negocio que
 * el resto de la página (`user.businessId`).
 */
export function useConversationFunnel(
  params: GetConversationFunnelParams,
  options?: { businessId?: string },
) {
  const businessIdFromStore = useEffectiveBusinessId();
  const fixedBusiness = options !== undefined && "businessId" in options;
  const isAllBusinessesSelected = !fixedBusiness && businessIdFromStore === "";
  const businessId =
    (fixedBusiness ? options.businessId : businessIdFromStore) || undefined;

  const query = useQuery<ConversationFunnel, Error>({
    queryKey: CONVERSATIONS_KEYS.funnel(params, businessId),
    queryFn: () => getConversationFunnel(businessId!, params),
    enabled: !!businessId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: retryUnlessAuthError,
  });

  return { ...query, isAllBusinessesSelected };
}

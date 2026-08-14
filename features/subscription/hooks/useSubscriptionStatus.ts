"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { getSubscriptionStatus } from "../services/subscription.service";
import { BILLING_KEYS, BILLING_STALE_TIME, BILLING_GC_TIME } from "./query-keys";

/** Estado de cuenta de la suscripción del negocio actual (pantalla "Estado de cuenta"). */
export function useSubscriptionStatus() {
  const businessId = useEffectiveBusinessId();

  return useQuery({
    queryKey: BILLING_KEYS.status(businessId ?? ""),
    queryFn: () => getSubscriptionStatus(businessId!),
    enabled: !!businessId,
    staleTime: BILLING_STALE_TIME,
    gcTime: BILLING_GC_TIME,
  });
}

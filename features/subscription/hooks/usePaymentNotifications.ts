"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { getPaymentNotifications } from "../services/subscription.service";
import { BILLING_KEYS, BILLING_STALE_TIME, BILLING_GC_TIME } from "./query-keys";

/** Historial de notificaciones de cobranza que TOGO le ha enviado al negocio actual. */
export function usePaymentNotifications() {
  const businessId = useEffectiveBusinessId();

  return useQuery({
    queryKey: BILLING_KEYS.notifications(businessId ?? ""),
    queryFn: () => getPaymentNotifications(businessId!),
    enabled: !!businessId,
    staleTime: BILLING_STALE_TIME,
    gcTime: BILLING_GC_TIME,
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { getPaymentHistory } from "../services/subscription.service";
import { BILLING_KEYS, BILLING_STALE_TIME, BILLING_GC_TIME } from "./query-keys";

/**
 * Historial de pagos registrados por TOGO para el negocio actual. `enabled`
 * (default `true`) permite gatear la consulta por permiso desde la página
 * — ver el comentario de `useSubscriptionStatus`.
 */
export function usePaymentHistory(enabled: boolean = true) {
  const businessId = useEffectiveBusinessId();

  return useQuery({
    queryKey: BILLING_KEYS.payments(businessId ?? ""),
    queryFn: () => getPaymentHistory(businessId!),
    enabled: !!businessId && enabled,
    staleTime: BILLING_STALE_TIME,
    gcTime: BILLING_GC_TIME,
  });
}

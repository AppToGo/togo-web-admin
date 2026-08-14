"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { getPaymentHistory } from "../services/subscription.service";
import { BILLING_KEYS, BILLING_STALE_TIME, BILLING_GC_TIME } from "./query-keys";

/** Historial de pagos registrados por TOGO para el negocio actual. */
export function usePaymentHistory() {
  const businessId = useEffectiveBusinessId();

  return useQuery({
    queryKey: BILLING_KEYS.payments(businessId ?? ""),
    queryFn: () => getPaymentHistory(businessId!),
    enabled: !!businessId,
    staleTime: BILLING_STALE_TIME,
    gcTime: BILLING_GC_TIME,
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { getSubscriptionStatus } from "../services/subscription.service";
import { BILLING_KEYS, BILLING_STALE_TIME, BILLING_GC_TIME } from "./query-keys";

/**
 * Estado de cuenta de la suscripción del negocio actual (pantalla "Estado
 * de cuenta"). `enabled` (default `true`, mismo patrón que
 * `useInboxSummary`) permite que la página no dispare la consulta hasta
 * confirmar `billing.view` — sin esto, un usuario sin el permiso dispara
 * el GET (y su 403) antes de que se resuelva la pantalla de acceso denegado.
 */
export function useSubscriptionStatus(enabled: boolean = true) {
  const businessId = useEffectiveBusinessId();

  return useQuery({
    queryKey: BILLING_KEYS.status(businessId ?? ""),
    queryFn: () => getSubscriptionStatus(businessId!),
    enabled: !!businessId && enabled,
    staleTime: BILLING_STALE_TIME,
    gcTime: BILLING_GC_TIME,
  });
}

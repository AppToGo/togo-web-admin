/**
 * WhatsApp Usage Hook
 *
 * Consumo de mensajería Meta del negocio (cupo gratis vs cobrado).
 */

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useBusinessStore } from "@/features/business/stores/business.store";
import { getWhatsAppUsage } from "../services/whatsapp.service";
import { WHATSAPP_ACCOUNTS_KEYS, STALE_TIME, GC_TIME } from "./query-keys";
import type { WhatsAppUsageSummary } from "../types";

/**
 * Hook para obtener el consumo de WhatsApp del negocio actual.
 */
export function useWhatsAppUsage() {
  const user = useAuthStore((state) => state.user);
  const { selectedBusinessId } = useBusinessStore();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const hasBusinessId = !!user?.businessId;
  const hasSelectedBusiness = !!selectedBusinessId;

  const isEnabled = isSuperAdmin ? hasSelectedBusiness : hasBusinessId;
  const businessId = isSuperAdmin
    ? selectedBusinessId
    : (user?.businessId ?? null);

  return useQuery<WhatsAppUsageSummary, Error>({
    queryKey: WHATSAPP_ACCOUNTS_KEYS.usage(businessId),
    queryFn: getWhatsAppUsage,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: isEnabled,
    // El consumo es en vivo (webhooks de estado de Meta): se refresca solo
    // mientras la pantalla está abierta.
    refetchInterval: 60_000,
  });
}

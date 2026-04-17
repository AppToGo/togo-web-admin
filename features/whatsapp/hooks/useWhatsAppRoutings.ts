/**
 * WhatsApp Routings Hooks
 *
 * Hooks para obtener datos de enrutamiento de WhatsApp usando TanStack Query.
 */

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useBusinessStore } from "@/features/business/stores/business.store";
import {
  getWhatsAppRoutings,
  getWhatsAppRoutingById,
} from "../services/whatsapp.service";
import {
  WHATSAPP_ROUTING_KEYS,
  STALE_TIME,
  GC_TIME,
} from "./query-keys";
import type { WhatsAppRouting } from "../types";

/**
 * Hook para obtener todas las reglas de enrutamiento de WhatsApp del negocio
 */
export function useWhatsAppRoutings() {
  const user = useAuthStore((state) => state.user);
  const { selectedBusinessId } = useBusinessStore();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const hasBusinessId = !!user?.businessId;
  const hasSelectedBusiness = !!selectedBusinessId;

  const isEnabled = isSuperAdmin ? hasSelectedBusiness : hasBusinessId;

  return useQuery<WhatsAppRouting[], Error>({
    queryKey: WHATSAPP_ROUTING_KEYS.lists(),
    queryFn: getWhatsAppRoutings,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: isEnabled,
  });
}

/**
 * Hook para obtener una regla de enrutamiento específica por ID
 */
export function useWhatsAppRouting(id: string | null) {
  return useQuery<WhatsAppRouting, Error>({
    queryKey: WHATSAPP_ROUTING_KEYS.detail(id ?? ""),
    queryFn: () => getWhatsAppRoutingById(id!),
    enabled: !!id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

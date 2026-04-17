/**
 * WhatsApp Accounts Hooks
 *
 * Hooks para obtener datos de cuentas de WhatsApp usando TanStack Query.
 */

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useBusinessStore } from "@/features/business/stores/business.store";
import {
  getWhatsAppAccounts,
  getWhatsAppAccountById,
} from "../services/whatsapp.service";
import {
  WHATSAPP_ACCOUNTS_KEYS,
  STALE_TIME,
  GC_TIME,
} from "./query-keys";
import type { WhatsAppAccount } from "../types";

/**
 * Hook para obtener todas las cuentas de WhatsApp del negocio actual
 */
export function useWhatsAppAccounts() {
  const user = useAuthStore((state) => state.user);
  const { selectedBusinessId } = useBusinessStore();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const hasBusinessId = !!user?.businessId;
  const hasSelectedBusiness = !!selectedBusinessId;

  const isEnabled = isSuperAdmin ? hasSelectedBusiness : hasBusinessId;

  return useQuery<WhatsAppAccount[], Error>({
    queryKey: WHATSAPP_ACCOUNTS_KEYS.lists(),
    queryFn: getWhatsAppAccounts,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: isEnabled,
  });
}

/**
 * Hook para obtener una cuenta de WhatsApp específica por ID
 */
export function useWhatsAppAccount(id: string | null) {
  return useQuery<WhatsAppAccount, Error>({
    queryKey: WHATSAPP_ACCOUNTS_KEYS.detail(id ?? ""),
    queryFn: () => getWhatsAppAccountById(id!),
    enabled: !!id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

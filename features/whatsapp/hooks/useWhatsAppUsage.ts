/**
 * WhatsApp Usage Hook
 *
 * Consumo de mensajería Meta del negocio (cupo gratis vs cobrado).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getHumanizedErrorMessage } from "@/lib/error.utils";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useBusinessStore } from "@/features/business/stores/business.store";
import {
  getWhatsAppUsage,
  syncWhatsAppUsage,
} from "../services/whatsapp.service";
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

/**
 * Pide a Meta el consumo oficial ya (botón "Actualizar" del gráfico) y
 * vuelve a cargar el resumen. Si Meta rechaza alguna cuenta lo avisa: el
 * gráfico seguiría mostrando solo el conteo en vivo.
 */
export function useSyncWhatsAppUsage() {
  const queryClient = useQueryClient();
  const t = useTranslations("whatsapp");

  return useMutation({
    mutationFn: syncWhatsAppUsage,

    onSuccess: ({ accounts }) => {
      const failed = accounts.filter((a) => !a.ok).length;
      if (failed > 0) {
        toast.error(t("usageChart.syncFailed", { count: failed }));
      } else {
        toast.success(t("usageChart.syncSuccess"));
      }
    },

    onError: (err) => {
      toast.error(
        getHumanizedErrorMessage(err) || t("usageChart.syncError")
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [...WHATSAPP_ACCOUNTS_KEYS.all, "usage"],
      });
    },
  });
}

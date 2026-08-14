"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { requestPlanChange } from "../services/subscription.service";
import { extractErrorMessage } from "@/lib/error.utils";
import { BILLING_KEYS } from "./query-keys";

/**
 * Envía la solicitud de cambio de plan (UpgradePlanModal). El plan del
 * negocio NO cambia acá — solo un SUPER_ADMIN, al verificar el pago, lo
 * activa desde el panel admin. Por eso solo se refleja `requestedPlan` en el
 * usuario local (para que el modal no vuelva a ofrecer el mismo upgrade),
 * nunca `subscriptionPlan`.
 */
export function useUpgradePlan() {
  const { setRequestedPlan } = useAuthStore();
  const user = useCurrentUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPlan: number) => {
      if (!user?.businessId) throw new Error("No business associated with user");
      return requestPlanChange(user.businessId, { plan: newPlan });
    },
    onSuccess: (data) => {
      setRequestedPlan(data.requestedPlan);
      // Para que `requestedPlan`/`requestGraceEndsAt` aparezcan al instante
      // en la pantalla de Estado de Cuenta sin esperar el staleTime.
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.all });
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Error al enviar la solicitud de plan"));
    },
  });
}

"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { createCheckout } from "../services/subscription.service";
import { redirectToWompiCheckout } from "../utils/wompi-checkout.util";
import { extractErrorMessage } from "@/lib/error.utils";

/**
 * Inicia un checkout de Wompi para el plan solicitado (o el actual, si es
 * una renovación) y redirige el browser al Checkout hospedado por Wompi.
 * La confirmación del pago la maneja el webhook del backend, no esta
 * llamada — al volver, useWompiReturnHandler (montado en DashboardLayout
 * vía useUpgradePlanModal) refresca el estado de cuenta.
 */
export function useWompiCheckout() {
  const user = useCurrentUser();

  return useMutation({
    mutationFn: async () => {
      if (!user?.businessId) throw new Error("No business associated with user");
      return createCheckout(user.businessId);
    },
    onSuccess: (checkout) => {
      redirectToWompiCheckout(checkout);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "No pudimos iniciar el pago con Wompi"));
    },
  });
}

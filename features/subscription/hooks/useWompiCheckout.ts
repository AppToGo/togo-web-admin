"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { createCheckout } from "../services/subscription.service";
import { redirectToWompiCheckout } from "../utils/wompi-checkout.util";
import { extractErrorMessage } from "@/lib/error.utils";

/**
 * Inicia un checkout de Wompi para el plan elegido (o el actual, si es una
 * renovación sin pasar `plan`) y redirige el browser al Checkout hospedado
 * por Wompi. Elegir un plan en el modal NO crea ninguna solicitud pendiente
 * — recién acá, al confirmar que se quiere pagar, se le pide el checkout a
 * Wompi. La confirmación del pago la maneja el webhook del backend, no esta
 * llamada — al volver, useWompiReturnHandler (montado en DashboardLayout
 * vía useUpgradePlanModal) refresca el estado de cuenta.
 */
export function useWompiCheckout() {
  const user = useCurrentUser();

  return useMutation({
    mutationFn: async (plan?: number) => {
      if (!user?.businessId) throw new Error("No business associated with user");
      return createCheckout(user.businessId, plan);
    },
    onSuccess: (checkout) => {
      redirectToWompiCheckout(checkout);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "No pudimos iniciar el pago con Wompi"));
    },
  });
}

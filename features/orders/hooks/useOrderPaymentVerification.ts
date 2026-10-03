/**
 * Último análisis del comprobante de un pedido.
 *
 * Solo se pide con el visor abierto: sin esto cada tarjeta del tablero
 * dispararía su propia request. El 404 ("todavía sin análisis") es una
 * respuesta válida y no se reintenta.
 */

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useBusinessStore } from "@/features/business/stores/business.store";
import { getOrderPaymentVerification } from "../services/order.service";
import type { PaymentVerification } from "../services/order.service";
import { ORDERS_KEYS } from "../types/order-cache.types";

export const paymentVerificationKey = (orderId: string) =>
  [...ORDERS_KEYS.detail(orderId), "payment-verification"] as const;

export function useOrderPaymentVerification(
  orderId: string,
  enabled = true
) {
  const { selectedBusinessId } = useBusinessStore();
  const { user } = useAuthStore();

  const effectiveBusinessId =
    selectedBusinessId || user?.businessId || undefined;

  return useQuery<PaymentVerification>({
    queryKey: paymentVerificationKey(orderId),
    queryFn: () => getOrderPaymentVerification(orderId, effectiveBusinessId),
    enabled: enabled && !!orderId && !!effectiveBusinessId,
    staleTime: 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

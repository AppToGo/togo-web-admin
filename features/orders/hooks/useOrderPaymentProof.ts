/**
 * Comprobante de pago de un pedido
 *
 * El backend firma la URL en cada lectura con un TTL de 15 minutos, así que
 * el caché vence antes que la URL: si el operador deja el visor abierto, al
 * reabrirlo recibe una firma nueva en vez de una imagen rota.
 */

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useBusinessStore } from "@/features/business/stores/business.store";
import { getOrderPaymentProof } from "../services/order.service";
import { ORDERS_KEYS } from "../types/order-cache.types";
import type { PaymentProof } from "../services/order.service";

/** Menos que el TTL de 15 min de la URL firmada. */
const PROOF_STALE_TIME = 10 * 60 * 1000;

export const paymentProofKey = (orderId: string) =>
  [...ORDERS_KEYS.detail(orderId), "payment-proof"] as const;

/**
 * @param orderId pedido del que traer el comprobante
 * @param enabled normalmente "el visor está abierto": sin esto cada tarjeta
 *                del tablero dispararía su propia request
 */
export function useOrderPaymentProof(orderId: string, enabled = true) {
  const { selectedBusinessId } = useBusinessStore();
  const { user } = useAuthStore();

  const effectiveBusinessId =
    selectedBusinessId || user?.businessId || undefined;

  return useQuery<PaymentProof>({
    queryKey: paymentProofKey(orderId),
    queryFn: () => getOrderPaymentProof(orderId, effectiveBusinessId),
    // Sin negocio no hay a dónde pedir: getBaseUrl lanzaría y el query
    // quedaría en error sin reintentar.
    enabled: enabled && !!orderId && !!effectiveBusinessId,
    staleTime: PROOF_STALE_TIME,
    // El 404 ("este pedido no tiene comprobante") es una respuesta válida, no
    // un fallo que valga la pena reintentar. Lo demás reintenta como el resto
    // del tablero.
    retry: (failureCount, error) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

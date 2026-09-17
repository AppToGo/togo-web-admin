"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { getCheckoutStatus } from "../services/subscription.service";
import { consumePendingCheckoutReference } from "../utils/wompi-checkout.util";
import { BILLING_KEYS } from "./query-keys";

const WOMPI_RETURN_TOAST_ID = "wompi-checkout-return";
/** Wompi confirma el pago en segundos — 3 intentos cada 2s alcanzan sin bloquear la UI de más. */
const POLL_ATTEMPTS = 3;
const POLL_INTERVAL_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Detecta la vuelta del Checkout de Wompi (redirectUrl trae `?wompiCheckout=return`,
 * ver useWompiCheckout/wompi-checkout.util.ts) y refresca el estado de cuenta.
 *
 * El webhook de Wompi (backend) es la única fuente de verdad de si el pago
 * se acreditó — esto es solo una mejora de UX para no dejar al negocio
 * mirando el plan viejo si vuelve antes de que el webhook corra. Montado
 * una sola vez junto con useUpgradePlanModal (DashboardLayout).
 */
export function useWompiReturnHandler(): void {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const user = useCurrentUser();

  useEffect(() => {
    if (searchParams.get("wompiCheckout") !== "return") return;
    if (!user?.businessId) return;

    const businessId = user.businessId;
    const reference = consumePendingCheckoutReference();

    // Limpia el query param ya — evita reprocesar en un refresh de página.
    const cleanParams = new URLSearchParams(searchParams.toString());
    cleanParams.delete("wompiCheckout");
    const cleanQuery = cleanParams.toString();
    router.replace(cleanQuery ? `${pathname}?${cleanQuery}` : pathname);

    async function checkPaymentStatus() {
      toast.loading("Verificando tu pago con Wompi...", { id: WOMPI_RETURN_TOAST_ID });

      let paid = false;
      if (reference) {
        for (let attempt = 0; attempt < POLL_ATTEMPTS && !paid; attempt++) {
          if (attempt > 0) await sleep(POLL_INTERVAL_MS);
          try {
            const result = await getCheckoutStatus(businessId, reference);
            paid = result.status === "PAID";
          } catch {
            // Reintenta en el siguiente intento — un error de red puntual no debe cortar el polling.
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.all });

      if (paid) {
        toast.success("¡Pago confirmado! Tu plan ya está activo.", { id: WOMPI_RETURN_TOAST_ID });
      } else {
        toast.message("Estamos verificando tu pago — te avisaremos apenas se confirme.", {
          id: WOMPI_RETURN_TOAST_ID,
        });
      }
    }

    void checkPaymentStatus();
    // Solo debe correr una vez al detectar la vuelta — no en cada cambio de
    // referencia de queryClient/router (estables, pero por las dudas).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user?.businessId]);
}

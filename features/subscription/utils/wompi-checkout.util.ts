import type { WompiCheckout } from "../services/subscription.service";

/**
 * Sesión de Wompi Checkout (redirect hospedado): construye la URL del
 * checkout de Wompi a partir de los parámetros que devuelve el backend
 * (POST /businesses/:id/billing/checkout) y redirige el browser ahí. Wompi
 * aloja el formulario de pago (tarjeta/Nequi/PSE/Bancolombia) y al terminar
 * vuelve a `redirectUrl`.
 *
 * NOTA: nombres de query params a confirmar contra un checkout de sandbox
 * real antes de producción — ver "Verificación end-to-end" en el plan.
 */
const WOMPI_CHECKOUT_BASE_URL = "https://checkout.wompi.co/p/";

export function buildWompiCheckoutUrl(checkout: WompiCheckout): string {
  const params = new URLSearchParams({
    "public-key": checkout.publicKey,
    currency: checkout.currency,
    "amount-in-cents": String(checkout.amountInCents),
    reference: checkout.reference,
    "signature:integrity": checkout.signature,
    "redirect-url": checkout.redirectUrl,
  });

  return `${WOMPI_CHECKOUT_BASE_URL}?${params.toString()}`;
}

/** sessionStorage: la reference del checkout en curso, para detectar la vuelta (ver useWompiReturnHandler). */
const PENDING_CHECKOUT_REFERENCE_KEY = "togo-wompi-pending-checkout-reference";

export function savePendingCheckoutReference(reference: string): void {
  try {
    sessionStorage.setItem(PENDING_CHECKOUT_REFERENCE_KEY, reference);
  } catch {
    // sessionStorage no disponible (modo privado, cuota excedida) — la vuelta
    // del checkout igual funciona, solo no podemos hacer polling específico
    // por reference; el refetch general de useSubscriptionStatus alcanza.
  }
}

export function consumePendingCheckoutReference(): string | null {
  try {
    const reference = sessionStorage.getItem(PENDING_CHECKOUT_REFERENCE_KEY);
    if (reference) sessionStorage.removeItem(PENDING_CHECKOUT_REFERENCE_KEY);
    return reference;
  } catch {
    return null;
  }
}

export function redirectToWompiCheckout(checkout: WompiCheckout): void {
  savePendingCheckoutReference(checkout.reference);
  window.location.href = buildWompiCheckoutUrl(checkout);
}

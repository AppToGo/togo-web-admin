/**
 * Línea de WhatsApp de Togo, el negocio del modo demo. `||` y no `??`: el
 * Dockerfile hornea la ARG aunque no se pase, y llega como cadena vacía.
 */
export const DEMO_WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_DEMO_WHATSAPP_NUMBER || "+573001112233";

/**
 * Días de prueba gratis por defecto en el frontend mientras carga el catálogo
 * del backend (`GET /businesses/plans`, que lee `TRIAL_DAYS` en `api-togo`).
 */
const parsedTrialDays = Number.parseInt(
  process.env.NEXT_PUBLIC_TRIAL_DAYS ?? "30",
  10
);
export const DEFAULT_TRIAL_DAYS =
  Number.isFinite(parsedTrialDays) && parsedTrialDays > 0 ? parsedTrialDays : 30;

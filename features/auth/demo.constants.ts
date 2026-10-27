/**
 * Línea de WhatsApp de Togo, el negocio del modo demo. `||` y no `??`: el
 * Dockerfile hornea la ARG aunque no se pase, y llega como cadena vacía.
 */
export const DEMO_WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_DEMO_WHATSAPP_NUMBER || "+573001112233";

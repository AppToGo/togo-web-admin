/**
 * Planes con acceso a personalizar el asistente (voz T18 y mensajes T22):
 * Pro (3) y Enterprise (4).
 *
 * Espejo del `canCustomizeVoice` de la API (`api-togo`), que es la que
 * decide; acá solo se evita mostrar lo que el negocio no puede usar.
 */

export const PRO_PLAN = 3;
export const ENTERPRISE_PLAN = 4;

/** El plan puede personalizar la voz y los mensajes del asistente. */
export function canCustomizeAssistant(plan: number | undefined): boolean {
  return plan === PRO_PLAN || plan === ENTERPRISE_PLAN;
}

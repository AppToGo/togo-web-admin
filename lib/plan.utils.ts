/**
 * Utilidades para manejo de planes de suscripción
 *
 * Los planes se identifican por números:
 * - 1 = Free
 * - 2 = Basic
 * - 3 = Pro
 * - 4 = Enterprise
 *
 * La fuente de verdad de límites/precios vive en el backend
 * (PlanConfigService, configurable por env) — ver usePlanCatalog().
 * El copy visible del modal de upgrade (features cualitativas por plan,
 * niveles de soporte) vive en i18n (subscription.upgradePlanModal.features
 * en i18n/messages/{locale}/subscription.json) para que quede traducido —
 * no en este archivo.
 */

export type PlanNumber = 1 | 2 | 3 | 4;

/**
 * Nequi payment info for manual transfers
 * TODO: Move to backend config when payment integration is implemented
 */
export const NEQUI_PAYMENT_INFO = {
  phone: '300 123 4567', // TODO: replace with real Nequi number
  name: 'ToGo SAS',
  instructions: 'Enviá el comprobante de pago por WhatsApp al número de soporte y un agente lo verificará en menos de 24 horas.',
  supportWhatsApp: '+57 300 000 0000', // TODO: replace with real support number
} as const;

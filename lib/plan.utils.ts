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
 * Este archivo solo guarda copy estático (features cualitativas, datos de
 * pago) que no tiene un equivalente numérico en el catálogo del backend.
 */

export type PlanNumber = 1 | 2 | 3 | 4;

/**
 * Features cualitativas por plan (sin números — los límites de sedes/usuarios
 * se generan dinámicamente desde el catálogo real en UpgradePlanModal, para
 * que nunca queden desactualizados si el backend cambia un límite por env).
 */
export const QUALITATIVE_PLAN_FEATURES: Record<Exclude<PlanNumber, 1>, string[]> = {
  2: ['Gestión de pedidos', 'Catálogo básico'],
  3: ['Métricas avanzadas', 'Soporte prioritario'],
  4: ['Todas las métricas', 'Soporte dedicado'],
};

/**
 * Nequi payment info for manual transfers
 * TODO: Move to backend config when payment integration is implemented
 */
export const NEQUI_PAYMENT_INFO = {
  phone: '300 123 4567', // TODO: replace with real Nequi number
  name: 'ToGo SAS',
  concept: 'Pago plan ToGo - {businessName}',
  instructions: 'Enviá el comprobante de pago por WhatsApp al número de soporte y un agente lo verificará en menos de 24 horas.',
  supportWhatsApp: '+57 300 000 0000', // TODO: replace with real support number
} as const;

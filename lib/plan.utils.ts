/**
 * Utilidades para manejo de planes de suscripción
 * 
 * Los planes se identifican por números:
 * - 1 = Free
 * - 2 = Basic  
 * - 3 = Pro
 * - 4 = Enterprise
 */

export type PlanNumber = 1 | 2 | 3 | 4;

export interface PlanInfo {
  /** Número del plan */
  number: PlanNumber;
  /** Nombre interno (kebab-case) */
  name: string;
  /** Nombre para mostrar */
  displayName: string;
  /** Máximo de sedes permitidas */
  maxBranches: number;
  /** Máximo de usuarios por sede */
  maxUsersPerBranch: number;
}

/**
 * Configuración de todos los planes
 */
export const PLANS: Record<PlanNumber, PlanInfo> = {
  1: { 
    number: 1, 
    name: 'free', 
    displayName: 'Free', 
    maxBranches: 1,
    maxUsersPerBranch: 3 
  },
  2: { 
    number: 2, 
    name: 'basic', 
    displayName: 'Basic', 
    maxBranches: 1,
    maxUsersPerBranch: 3 
  },
  3: { 
    number: 3, 
    name: 'pro', 
    displayName: 'Pro', 
    maxBranches: 5,
    maxUsersPerBranch: 10 
  },
  4: { 
    number: 4, 
    name: 'enterprise', 
    displayName: 'Enterprise', 
    maxBranches: Infinity,
    maxUsersPerBranch: Infinity 
  },
};

/**
 * Formatea el número de plan a nombre legible
 * @param planNumber - Número del plan (1-4)
 * @returns Nombre del plan para mostrar
 */
export function formatPlanName(planNumber: number): string {
  return PLANS[planNumber as PlanNumber]?.displayName || `Plan ${planNumber}`;
}

/**
 * Formatea el número de plan a nombre en minúsculas
 * @param planNumber - Número del plan (1-4)
 * @returns Nombre interno del plan (kebab-case)
 */
export function formatPlanNameLower(planNumber: number): string {
  return PLANS[planNumber as PlanNumber]?.name || `plan-${planNumber}`;
}

/**
 * Obtiene el máximo de sedes permitidas para un plan
 * @param planNumber - Número del plan (1-4)
 * @returns Número máximo de sedes
 */
export function getMaxBranches(planNumber: number): number {
  return PLANS[planNumber as PlanNumber]?.maxBranches || 1;
}

/**
 * Obtiene el máximo de usuarios por sede para un plan
 * @param planNumber - Número del plan (1-4)
 * @returns Número máximo de usuarios por sede
 */
export function getMaxUsersPerBranch(planNumber: number): number {
  return PLANS[planNumber as PlanNumber]?.maxUsersPerBranch || 3;
}

/**
 * Verifica si se puede agregar una nueva sede
 * @param planNumber - Número del plan (1-4)
 * @param currentBranches - Número actual de sedes
 * @returns true si se puede agregar otra sede
 */
export function canAddBranch(planNumber: number, currentBranches: number): boolean {
  const max = getMaxBranches(planNumber);
  return currentBranches < max;
}

/**
 * Obtiene información completa del plan
 * @param planNumber - Número del plan (1-4)
 * @returns Información completa del plan o undefined si no existe
 */
export function getPlanInfo(planNumber: number): PlanInfo | undefined {
  return PLANS[planNumber as PlanNumber];
}

/**
 * Obtiene el siguiente plan disponible para upgrade
 * @param planNumber - Número del plan actual (1-4)
 * @returns Número del siguiente plan o null si es el máximo
 */
export function getNextPlan(planNumber: number): PlanNumber | null {
  const next: Record<PlanNumber, PlanNumber | null> = {
    1: 2,
    2: 3,
    3: 4,
    4: null,
  };
  return next[planNumber as PlanNumber] ?? null;
}

/**
 * Verifica si un plan tiene soporte multi-sede
 * @param planNumber - Número del plan (1-4)
 * @returns true si el plan soporta múltiples sedes
 */
export function supportsMultipleBranches(planNumber: number): boolean {
  return getMaxBranches(planNumber) > 1;
}

/**
 * Determina el modo de visualización basado en el número de sedes
 * @param branchCount - Número de sedes actuales
 * @returns 'SINGLE' | 'MULTI' modo de visualización
 */
export function getBranchMode(branchCount: number): 'SINGLE' | 'MULTI' {
  return branchCount <= 1 ? 'SINGLE' : 'MULTI';
}

/**
 * Pricing for each plan (COP)
 * TODO: Move to backend config when payment integration is implemented
 */
export const PLAN_PRICES: Record<Exclude<PlanNumber, 1>, { monthly: number; currency: string }> = {
  2: { monthly: 89000, currency: 'COP' },
  3: { monthly: 189000, currency: 'COP' },
  4: { monthly: 389000, currency: 'COP' },
};

/**
 * Features included in each paid plan (for display in upgrade modal)
 */
export const PLAN_FEATURES: Record<Exclude<PlanNumber, 1>, string[]> = {
  2: ['1 sede', 'Hasta 3 usuarios', 'Gestión de pedidos', 'Catálogo básico'],
  3: ['Hasta 5 sedes', 'Hasta 10 usuarios por sede', 'Métricas avanzadas', 'Soporte prioritario'],
  4: ['Sedes ilimitadas', 'Usuarios ilimitados', 'Todas las métricas', 'Soporte dedicado'],
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

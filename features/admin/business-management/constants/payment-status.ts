/**
 * Payment Status Constants
 * Colors and configurations for payment status visualization
 */

export const DUE_DATE_COLORS = {
  // 7+ días: Verde suave
  SAFE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  // 4-6 días: Verde-amarillo
  WARNING: 'bg-lime-100 text-lime-700 border-lime-200',
  // 1-3 días: Ámbar (medio)
  URGENT: 'bg-amber-100 text-amber-700 border-amber-200',
  // 0 días: Rojo/Rosa (intenso)
  CRITICAL: 'bg-rose-100 text-rose-700 border-rose-200',
  // Vencido: Rojo oscuro (máximo)
  OVERDUE: 'bg-red-100 text-red-700 border-red-200',
} as const;

export const PAYMENT_STATUS_CONFIG = {
  PENDING: { 
    label: 'Pendiente', 
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200', 
    icon: 'Clock' 
  },
  PAID: { 
    label: 'Pagado', 
    color: 'bg-green-100 text-green-700 border-green-200', 
    icon: 'CheckCircle' 
  },
  OVERDUE: { 
    label: 'Vencido', 
    color: 'bg-red-100 text-red-700 border-red-200', 
    icon: 'AlertCircle' 
  },
  GRACE_PERIOD: { 
    label: 'Gracia', 
    color: 'bg-orange-100 text-orange-700 border-orange-200', 
    icon: 'AlertTriangle' 
  },
} as const;

export const PLAN_OPTIONS = [
  { value: 1, label: 'Free', maxBranches: 1 },
  { value: 2, label: 'Basic', maxBranches: 3 },
  { value: 3, label: 'Pro', maxBranches: 10 },
  { value: 4, label: 'Enterprise', maxBranches: 100 },
] as const;

export const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'CARD', label: 'Tarjeta' },
  { value: 'DEPOSIT', label: 'Depósito' },
  { value: 'CHECK', label: 'Cheque' },
  { value: 'OTHER', label: 'Otro' },
] as const;

export const NOTIFICATION_TYPES = [
  { value: 'PAYMENT_REMINDER', label: 'Recordatorio de pago', defaultSubject: 'Recordatorio de pago próximo' },
  { value: 'OVERDUE_WARNING', label: 'Advertencia de vencimiento', defaultSubject: 'Pago vencido - Acción requerida' },
  { value: 'GRACE_PERIOD_NOTICE', label: 'Aviso de periodo de gracia', defaultSubject: 'Estás en periodo de gracia' },
  { value: 'CUSTOM', label: 'Personalizado', defaultSubject: '' },
] as const;

/**
 * Get severity based on days until due date
 */
export function getDueDateSeverity(daysUntilDue: number | null): keyof typeof DUE_DATE_COLORS {
  if (daysUntilDue === null) return 'SAFE';
  if (daysUntilDue < 0) return 'OVERDUE';
  if (daysUntilDue === 0) return 'CRITICAL';
  if (daysUntilDue <= 3) return 'URGENT';
  if (daysUntilDue <= 6) return 'WARNING';
  return 'SAFE';
}

/**
 * Get color class for due date badge
 */
export function getDueDateColorClass(daysUntilDue: number | null): string {
  const severity = getDueDateSeverity(daysUntilDue);
  return DUE_DATE_COLORS[severity];
}

/**
 * Format days until due for display
 */
export function formatDaysUntilDue(daysUntilDue: number | null): string {
  if (daysUntilDue === null) return 'Sin fecha';
  if (daysUntilDue < 0) return `Vencido ${Math.abs(daysUntilDue)} días`;
  if (daysUntilDue === 0) return 'Vence hoy';
  if (daysUntilDue === 1) return '1 día';
  return `${daysUntilDue} días`;
}

/**
 * Get plan label by plan value
 */
export function getPlanLabel(plan: number): string {
  const planOption = PLAN_OPTIONS.find(p => p.value === plan);
  return planOption?.label || `Plan ${plan}`;
}

/**
 * Get plan max branches by plan value
 */
export function getPlanMaxBranches(plan: number): number {
  const planOption = PLAN_OPTIONS.find(p => p.value === plan);
  return planOption?.maxBranches || 1;
}

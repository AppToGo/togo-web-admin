/**
 * Billing Query Keys
 *
 * Query keys centralizados para el estado de cuenta self-service del owner
 * (mismo patrón que `features/user-permissions/hooks/query-keys.ts`).
 */

export const BILLING_KEYS = {
  all: ["billing"] as const,
  status: (businessId: string) => [...BILLING_KEYS.all, "status", businessId] as const,
  payments: (businessId: string) => [...BILLING_KEYS.all, "payments", businessId] as const,
  notifications: (businessId: string) =>
    [...BILLING_KEYS.all, "notifications", businessId] as const,
};

// Consulta al entrar (sin push en tiempo real) — stale corto para que un
// cambio hecho por un admin (pago registrado, notificación enviada) se
// refleje pronto sin necesidad de refrescar manualmente.
export const BILLING_STALE_TIME = 30 * 1000;
export const BILLING_GC_TIME = 5 * 60 * 1000;

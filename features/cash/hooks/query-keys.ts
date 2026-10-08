/**
 * Query keys de caja — mismo patrón que `ORDERS_KEYS`/`TABLE_KEYS`.
 * Incluyen businessId+branchId: el scope multitenant también vive en caché.
 */
export const STALE_TIME = 30 * 1000; // 30 segundos, igual que tables/orders.

export const CASH_KEYS = {
  all: ["cash"] as const,
  registers: (businessId?: string, branchId?: string) =>
    [...CASH_KEYS.all, "registers", businessId, branchId] as const,
  openSessions: (businessId?: string, branchId?: string) =>
    [...CASH_KEYS.all, "open-sessions", businessId, branchId] as const,
  sessionsHistory: (businessId?: string, branchId?: string, params?: unknown) =>
    [...CASH_KEYS.all, "sessions-history", businessId, branchId, params] as const,
  sessionSummary: (businessId?: string, branchId?: string, sessionId?: string) =>
    [...CASH_KEYS.all, "session-summary", businessId, branchId, sessionId] as const,
  movements: (businessId?: string, branchId?: string, sessionId?: string, params?: unknown) =>
    [...CASH_KEYS.all, "movements", businessId, branchId, sessionId, params] as const,
  collections: (businessId?: string, branchId?: string, status?: string) =>
    [...CASH_KEYS.all, "collections", businessId, branchId, status] as const,
  overview: (businessId?: string) => [...CASH_KEYS.all, "overview", businessId] as const,
  audit: (businessId?: string, params?: unknown) =>
    [...CASH_KEYS.all, "audit", businessId, params] as const,
};

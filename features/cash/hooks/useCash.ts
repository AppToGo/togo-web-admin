/**
 * Queries de caja — mismo patrón que `useOrders` / `useTables`.
 * Todas requieren businessId+branchId: la sede se resuelve fuera del hook
 * (misma heurística que `NewOrderDrawer`: única filtrada → default → primera).
 */
import { useQuery } from "@tanstack/react-query";
import { STALE_TIME } from "./query-keys";
import * as cashService from "../services/cash.service";
import { CASH_KEYS } from "./query-keys";
import type { CashCollection } from "../types/cash.types";

export function useRegisters(businessId: string | null, branchId: string | null) {
  return useQuery({
    queryKey: CASH_KEYS.registers(businessId ?? undefined, branchId ?? undefined),
    queryFn: () => cashService.getRegisters(businessId!, branchId!),
    enabled: !!businessId && !!branchId,
    staleTime: STALE_TIME,
  });
}

export function useOpenSessions(businessId: string | null, branchId: string | null) {
  return useQuery({
    queryKey: CASH_KEYS.openSessions(businessId ?? undefined, branchId ?? undefined),
    queryFn: () => cashService.getOpenSessions(businessId!, branchId!),
    enabled: !!businessId && !!branchId,
    staleTime: STALE_TIME,
  });
}

export function useSessionsHistory(
  businessId: string | null,
  branchId: string | null,
  params?: { page?: number; limit?: number; dateFrom?: string; dateTo?: string }
) {
  return useQuery({
    queryKey: CASH_KEYS.sessionsHistory(
      businessId ?? undefined,
      branchId ?? undefined,
      params
    ),
    queryFn: () => cashService.getSessionsHistory(businessId!, branchId!, params),
    enabled: !!businessId && !!branchId,
    staleTime: STALE_TIME,
  });
}

export function useSessionSummary(
  businessId: string | null,
  branchId: string | null,
  sessionId: string | null
) {
  return useQuery({
    queryKey: CASH_KEYS.sessionSummary(
      businessId ?? undefined,
      branchId ?? undefined,
      sessionId ?? undefined
    ),
    queryFn: () => cashService.getSessionSummary(businessId!, branchId!, sessionId!),
    enabled: !!businessId && !!branchId && !!sessionId,
    staleTime: STALE_TIME,
  });
}

export function useSessionMovements(
  businessId: string | null,
  branchId: string | null,
  sessionId: string | null,
  params?: { page?: number; limit?: number }
) {
  return useQuery({
    queryKey: CASH_KEYS.movements(
      businessId ?? undefined,
      branchId ?? undefined,
      sessionId ?? undefined,
      params
    ),
    queryFn: () => cashService.getSessionMovements(businessId!, branchId!, sessionId!, params),
    enabled: !!businessId && !!branchId && !!sessionId,
    staleTime: STALE_TIME,
  });
}

export function useCollections(
  businessId: string | null,
  branchId: string | null,
  status: CashCollection["status"] = "PENDING_SETTLEMENT"
) {
  return useQuery({
    queryKey: CASH_KEYS.collections(businessId ?? undefined, branchId ?? undefined, status),
    queryFn: () => cashService.getCollections(businessId!, branchId!, status),
    enabled: !!businessId && !!branchId,
    staleTime: STALE_TIME,
  });
}

export function useOwnerOverview(businessId: string | null, enabled = true) {
  return useQuery({
    queryKey: CASH_KEYS.overview(businessId ?? undefined),
    queryFn: () => cashService.getOwnerOverview(businessId!),
    enabled: !!businessId && enabled,
    staleTime: STALE_TIME,
  });
}

export function useCashAudit(
  businessId: string | null,
  params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    branchId?: string;
    cashSessionId?: string;
    actorUserId?: string;
    action?: string;
    channel?: string;
    orderNumber?: string;
  }
) {
  return useQuery({
    queryKey: CASH_KEYS.audit(businessId ?? undefined, params),
    queryFn: () => cashService.queryAudit(businessId!, params),
    enabled: !!businessId,
    staleTime: STALE_TIME,
  });
}

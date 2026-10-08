/**
 * Cash Service — consume los endpoints de caja del backend.
 * Mismo patrón que `features/tables/services/table.service.ts`:
 * basePath con businessId+branchId y `useCashStore` de zustand.
 */
import apiClient from "@/services/api.service";
import type {
  CashRegister,
  CashSession,
  CashMovement,
  CashCollection,
  SessionSummary,
  CashAuditEntry,
  OwnerOverviewBranch,
  Paginated,
  WithdrawalAuthorizer,
} from "../types/cash.types";

function basePath(businessId: string, branchId: string): string {
  return `/businesses/${businessId}/branches/${branchId}/cash`;
}

function businessPath(businessId: string): string {
  return `/businesses/${businessId}/cash`;
}

export async function getRegisters(businessId: string, branchId: string): Promise<CashRegister[]> {
  const { data } = await apiClient.get<CashRegister[]>(`${basePath(businessId, branchId)}/registers`);
  return data;
}

export async function createRegister(
  businessId: string,
  branchId: string,
  payload: { name: string }
): Promise<CashRegister> {
  const { data } = await apiClient.post<CashRegister>(
    `${basePath(businessId, branchId)}/registers`,
    payload
  );
  return data;
}

export async function updateRegister(
  businessId: string,
  branchId: string,
  id: string,
  payload: { name?: string; isActive?: boolean }
): Promise<CashRegister> {
  const { data } = await apiClient.patch<CashRegister>(
    `${basePath(businessId, branchId)}/registers/${id}`,
    payload
  );
  return data;
}

export async function openSession(
  businessId: string,
  branchId: string,
  payload: { cashRegisterId: string; openingAmount: number; notes?: string }
): Promise<CashSession> {
  const { data } = await apiClient.post<CashSession>(
    `${basePath(businessId, branchId)}/sessions`,
    payload
  );
  return data;
}

export async function getOpenSessions(businessId: string, branchId: string) {
  const { data } = await apiClient.get(`${basePath(businessId, branchId)}/sessions/open`);
  return data as Array<
    CashSession & {
      expectedAmount: string;
      register: { id: string; name: string };
    }
  >;
}

export interface SessionsHistoryParams {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  status?: CashSession["status"];
  cashRegisterId?: string;
}

export async function getSessionsHistory(
  businessId: string,
  branchId: string,
  params?: SessionsHistoryParams
): Promise<Paginated<CashSession & { register: { id: string; name: string } }>> {
  const { data } = await apiClient.get<Paginated<CashSession & { register: { id: string; name: string } }>>(
    `${basePath(businessId, branchId)}/sessions`,
    { params }
  );
  return data;
}

export async function getSessionSummary(
  businessId: string,
  branchId: string,
  sessionId: string
): Promise<SessionSummary> {
  const { data } = await apiClient.get<SessionSummary>(
    `${basePath(businessId, branchId)}/sessions/${sessionId}`
  );
  return data;
}

export async function getSessionMovements(
  businessId: string,
  branchId: string,
  sessionId: string,
  params?: { page?: number; limit?: number }
): Promise<Paginated<CashMovement>> {
  const { data } = await apiClient.get<Paginated<CashMovement>>(
    `${basePath(businessId, branchId)}/sessions/${sessionId}/movements`,
    { params }
  );
  return data;
}

export async function createManualMovement(
  businessId: string,
  branchId: string,
  sessionId: string,
  payload: {
    type: "MANUAL_IN" | "MANUAL_OUT" | "WITHDRAWAL";
    amount: number;
    category?: string;
    notes?: string;
    reason?: string;
    authorizedByUserId?: string;
  }
): Promise<CashMovement> {
  const { data } = await apiClient.post<CashMovement>(
    `${basePath(businessId, branchId)}/sessions/${sessionId}/movements`,
    payload
  );
  return data;
}

export async function settleCollections(
  businessId: string,
  branchId: string,
  sessionId: string,
  payload: { collectionIds: string[]; receivedAmount: number; reason?: string }
) {
  const { data } = await apiClient.post(
    `${basePath(businessId, branchId)}/sessions/${sessionId}/settlements`,
    payload
  );
  return data as {
    batchId: string;
    settled: number;
    expected: string;
    received: string;
    difference: string;
    movementId: string;
  };
}

export async function closeSession(
  businessId: string,
  branchId: string,
  sessionId: string,
  payload: { denominations: Record<string, number>; countedAmount?: number; notes?: string }
): Promise<SessionSummary> {
  const { data } = await apiClient.post<SessionSummary>(
    `${basePath(businessId, branchId)}/sessions/${sessionId}/close`,
    payload
  );
  return data;
}

export async function getCollections(
  businessId: string,
  branchId: string,
  status: CashCollection["status"] = "PENDING_SETTLEMENT"
): Promise<CashCollection[]> {
  const { data } = await apiClient.get<CashCollection[]>(
    `${basePath(businessId, branchId)}/collections`,
    { params: { status } }
  );
  return data;
}

/**
 * Quién puede autorizar un retiro en la sede (sin el propio cajero). Endpoint
 * propio de la acción (`cash.withdraw`): no depende de `user.view`.
 */
export async function getWithdrawalAuthorizers(
  businessId: string,
  branchId: string
): Promise<WithdrawalAuthorizer[]> {
  const { data } = await apiClient.get<WithdrawalAuthorizer[]>(
    `${basePath(businessId, branchId)}/authorizers`
  );
  return data;
}

export async function getOwnerOverview(businessId: string): Promise<OwnerOverviewBranch[]> {
  const { data } = await apiClient.get<OwnerOverviewBranch[]>(
    `${businessPath(businessId)}/overview`
  );
  return data;
}

export async function queryAudit(
  businessId: string,
  params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    branchId?: string;
    cashRegisterId?: string;
    cashSessionId?: string;
    actorUserId?: string;
    action?: string;
    channel?: string;
    orderNumber?: string;
  }
): Promise<Paginated<CashAuditEntry>> {
  const { data } = await apiClient.get<Paginated<CashAuditEntry>>(
    `${businessPath(businessId)}/audit`,
    { params }
  );
  return data;
}

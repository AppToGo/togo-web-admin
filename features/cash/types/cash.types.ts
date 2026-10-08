/**
 * Caja ligada a Pedidos (docs/caja-pedidos.md) — tipos del admin.
 * Espejan los contratos del backend (`src/cash/`) sin lógica.
 */

export interface CashRegister {
  id: string;
  businessId: string;
  branchId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  openSession: {
    id: string;
    openedAt: string;
    openedById: string;
    openedByName: string | null;
  } | null;
}

export interface CashSession {
  id: string;
  businessId: string;
  branchId: string;
  cashRegisterId: string;
  status: "OPEN" | "CLOSED";
  openedById: string;
  openedAt: string;
  openingAmount: string;
  closedById: string | null;
  closedAt: string | null;
  expectedAmount: string | null;
  countedAmount: string | null;
  difference: string | null;
  closingNotes: string | null;
  register?: { id: string; name: string };
  openedByName?: string | null;
  closedByName?: string | null;
}

export interface CashMovement {
  id: string;
  cashSessionId: string;
  sequence: number;
  type:
    | "ORDER_PAYMENT"
    | "SETTLEMENT"
    | "MANUAL_IN"
    | "MANUAL_OUT"
    | "WITHDRAWAL"
    | "REFUND";
  direction: "IN" | "OUT";
  amount: string;
  receivedAmount: string | null;
  changeAmount: string | null;
  orderId: string | null;
  category: string | null;
  notes: string | null;
  settlementBatchId: string | null;
  createdAt: string;
  order?: { id: string; orderNumber: number | null; total: string } | null;
}

export interface CashCollection {
  id: string;
  orderId: string;
  businessId: string;
  branchId: string;
  amount: string;
  status: "PENDING_SETTLEMENT" | "SETTLED" | "VOIDED";
  holderUserId: string | null;
  holderName: string | null;
  collectedAt: string;
  order?: {
    id: string;
    orderNumber: number | null;
    total: string;
    status: string;
    deliveryType: string;
  } | null;
}

export interface SessionSummary {
  session: CashSession;
  expectedAmount: string;
  totalsByType: Array<{
    type: CashMovement["type"];
    direction: CashMovement["direction"];
    total: string;
    count: number;
  }>;
  cashSales: { total: string; count: number };
  otherPaymentMethods: Array<{ method: string; total: string; count: number }>;
  pendingCollections: { count: number; total: string };
  auditTrail: Array<CashAuditEntry>;
}

export interface CashAuditEntry {
  id: string;
  businessId: string;
  branchId: string;
  action: string;
  actorUserId: string;
  actorName: string;
  actorRole: string;
  channel: string;
  cashRegisterId: string | null;
  cashSessionId: string | null;
  cashMovementId: string | null;
  orderId: string | null;
  orderNumber: number | null;
  amount: string | null;
  before: unknown;
  after: unknown;
  reason: string | null;
  createdAt: string;
}

export interface OwnerOverviewBranch {
  branch: { id: string; name: string };
  openSessions: Array<CashSession & { expectedAmount: string }>;
  pendingSettlement: { count: number; total: string; holders: string[] };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export const COP_BILLS = [100000, 50000, 20000, 10000, 5000, 2000];
export const COP_COINS = [1000, 500, 200, 100, 50];

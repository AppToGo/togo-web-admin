import { type Page } from "playwright/test";

/**
 * Network mocks for the `/dashboard/cash` page (E2E).
 *
 * Same dispatcher pattern as `mock-orders-api.ts`: one `page.route()`
 * for every `/v1/**` call, `route.fallback()` for the rest. Register
 * AFTER `mockLoginSuccess(page)` and BEFORE `mockBoardPermissions(page)`
 * (last matching route wins).
 */

export const BUSINESS_ID = "e2e-test-business-id";
export const BRANCH_ID = "e2e-test-branch-id";

const FAKE_BRANCH = {
  id: BRANCH_ID,
  businessId: BUSINESS_ID,
  name: "Sede Centro",
  slug: "sede-centro",
  code: "CC-001",
  isMainBranch: true,
  isActive: true,
  address: "Calle 123",
  timezone: "America/Bogota",
  currency: "COP",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const FAKE_SESSION = {
  defaultBranchId: BRANCH_ID,
  branches: [{ id: BRANCH_ID, name: FAKE_BRANCH.name, isMainBranch: true, role: "OWNER" }],
  business: { id: BUSINESS_ID, name: "Test Business", plan: "PRO", maxBranches: 5 },
  userPreferences: { defaultBranchId: BRANCH_ID },
};

export interface CashMockOptions {
  /** When false, the register has no open session (shows "Abrir turno"). */
  openSession?: boolean;
}

export function cashRegister(openSession = true) {
  return {
    id: "reg-1",
    businessId: BUSINESS_ID,
    branchId: BRANCH_ID,
    name: "Caja 1",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    openSession: openSession
      ? {
          id: "sess-1",
          openedAt: new Date().toISOString(),
          openedById: "user-1",
          openedByName: "Cajera E2E",
        }
      : null,
  };
}

const SUMMARY = {
  session: {
    id: "sess-1",
    businessId: BUSINESS_ID,
    branchId: BRANCH_ID,
    cashRegisterId: "reg-1",
    status: "OPEN",
    openedById: "user-1",
    openedAt: new Date().toISOString(),
    openingAmount: "0",
    closedById: null,
    closedAt: null,
    expectedAmount: "50000",
    countedAmount: null,
    difference: null,
    closingNotes: null,
  },
  expectedAmount: "50000",
  totalsByType: [
    { type: "ORDER_PAYMENT", direction: "IN", total: "50000", count: 2 },
  ],
  cashSales: { total: "50000", count: 2 },
  otherPaymentMethods: [],
  pendingCollections: { count: 1, total: "20000" },
  auditTrail: [],
};

const MOVEMENTS_PAGE = {
  items: [
    {
      id: "mov-1",
      cashSessionId: "sess-1",
      sequence: 1,
      type: "ORDER_PAYMENT",
      direction: "IN",
      amount: "30000",
      receivedAmount: "30000",
      changeAmount: "0",
      orderId: "order-1",
      category: null,
      notes: null,
      settlementBatchId: null,
      createdAt: new Date().toISOString(),
      order: { id: "order-1", orderNumber: 101, total: "30000" },
    },
  ],
  total: 1,
  page: 1,
  limit: 30,
};

const COLLECTIONS = [
  {
    id: "col-1",
    orderId: "order-2",
    businessId: BUSINESS_ID,
    branchId: BRANCH_ID,
    amount: "20000",
    status: "PENDING_SETTLEMENT",
    holderUserId: "user-2",
    holderName: "Repartidor E2E",
    collectedAt: new Date().toISOString(),
    order: {
      id: "order-2",
      orderNumber: 102,
      total: "20000",
      status: "CONFIRMED",
      deliveryType: "DELIVERY",
    },
  },
];

/** Authorizers returned by `GET …/cash/authorizers` (withdrawals). */
export const AUTHORIZERS = [{ id: "owner-1", name: "Dueña E2E" }];

const SESSIONS_HISTORY = {
  items: [
    // An OPEN shift of another register: the API returns it unless the
    // client filters by `status` / `cashRegisterId`.
    {
      id: "sess-open-2",
      businessId: BUSINESS_ID,
      branchId: BRANCH_ID,
      cashRegisterId: "reg-2",
      status: "OPEN",
      openedById: "user-1",
      openedAt: new Date().toISOString(),
      openingAmount: "0",
      closedById: null,
      closedAt: null,
      expectedAmount: null,
      countedAmount: null,
      difference: null,
      closingNotes: null,
      register: { id: "reg-2", name: "Caja 2 en curso" },
    },
    {
      id: "sess-0",
      businessId: BUSINESS_ID,
      branchId: BRANCH_ID,
      cashRegisterId: "reg-1",
      status: "CLOSED",
      openedById: "user-1",
      openedAt: new Date().toISOString(),
      openingAmount: "0",
      closedById: "user-1",
      closedAt: new Date().toISOString(),
      expectedAmount: "40000",
      countedAmount: "40000",
      difference: "0",
      closingNotes: null,
      register: { id: "reg-1", name: "Caja 1" },
    },
  ],
  total: 1,
  page: 1,
  limit: 5,
};

const EMPTY_AUDIT = { items: [], total: 0, page: 1, limit: 50 };

/** Por cobrar: una mesa ya entregada sin pagar y un pedido para recoger. */
const RECEIVABLES = [
  {
    id: "ord-rec-1",
    orderNumber: 1056,
    total: "46000",
    status: "COMPLETED",
    deliveryType: "DINE_IN",
    paymentMethod: "CASH",
    tableLabel: "2",
    customerName: null,
    createdAt: "2026-10-08T15:00:00.000Z",
  },
  {
    id: "ord-rec-2",
    orderNumber: 1060,
    total: "27500",
    status: "READY",
    deliveryType: "PICKUP",
    paymentMethod: null,
    tableLabel: null,
    customerName: "Julián Mora",
    createdAt: "2026-10-08T15:20:00.000Z",
  },
];

export async function mockCashDashboard(
  page: Page,
  options: CashMockOptions = {}
): Promise<void> {
  const { openSession = true } = options;
  await page.route("**/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path.endsWith("/branches")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([FAKE_BRANCH]),
      });
    }

    if (path.endsWith("/auth/session")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(FAKE_SESSION),
      });
    }

    if (path.includes("/cash/registers")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([cashRegister(openSession)]),
      });
    }

    if (path.endsWith("/cash/receivables")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(RECEIVABLES),
      });
    }

    if (path.endsWith("/cash/collections") || path.includes("/cash/collections?")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(COLLECTIONS),
      });
    }

    if (path.includes("/cash/sessions/") && path.endsWith("/movements")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOVEMENTS_PAGE),
      });
    }

    if (path.includes("/cash/sessions/sess-1")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(SUMMARY),
      });
    }

    if (path.includes("/cash/sessions")) {
      // Same filters as the backend (`status`, `cashRegisterId`).
      const status = url.searchParams.get("status");
      const registerId = url.searchParams.get("cashRegisterId");
      const items = SESSIONS_HISTORY.items.filter(
        (session) =>
          (!status || session.status === status) &&
          (!registerId || session.cashRegisterId === registerId)
      );
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...SESSIONS_HISTORY, items, total: items.length }),
      });
    }

    if (path.endsWith("/cash/authorizers")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(AUTHORIZERS),
      });
    }

    if (path.includes("/cash/overview")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    }

    if (path.includes("/cash/audit")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(EMPTY_AUDIT),
      });
    }

    await route.fallback();
  });
}

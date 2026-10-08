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

const SESSIONS_HISTORY = {
  items: [
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
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(SESSIONS_HISTORY),
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

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
  /** Products with a photo: the POS grid view is available. */
  productImages?: boolean;
  /** `GET …/orders/:id/receipt/whatsapp-window` (default: window closed). */
  whatsappWindow?: "OPEN" | "WINDOW_CLOSED" | "NO_PHONE";
  /** Receives every `POST …/orders` body (Caja · Vender). */
  onCreateOrder?: (body: Record<string, unknown>) => void;
}

/** Sellable inventory of the branch (Caja · Vender). */
function inventory(withImages: boolean) {
  return [
    { name: "Hamburguesa clásica", category: ["cat-burgers", "Hamburguesas"], price: 18000 },
    { name: "Limonada natural", category: ["cat-drinks", "Bebidas"], price: 8000 },
    { name: "Papas a la francesa", category: ["cat-sides", "Adiciones"], price: 7000 },
  ].map((product, index) => ({
    id: `inv-${index}`,
    businessId: BUSINESS_ID,
    branchId: BRANCH_ID,
    productVariantId: `var-${index}`,
    productName: product.name,
    productSlug: `p-${index}`,
    productImage: withImages && index === 0 ? "data:image/gif;base64,R0lGODlhAQABAAAAACw=" : null,
    basePrice: product.price,
    stock: null,
    isAvailable: true,
    isActivated: true,
    priceOverride: null,
    effectivePrice: product.price,
    categoryId: product.category[0],
    categoryName: product.category[1],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

/** Branch config: counter, dine-in and flat delivery enabled. */
const BRANCH_DETAIL = {
  ...FAKE_BRANCH,
  deliveryConfig: { type: "FLAT", flatFee: 4000 },
  dineInConfig: { enabled: true, allowCustomers: false, allowOperators: true },
  counterConfig: { enabled: true },
  transferOptions: { enabled: false, options: [] },
};

const TABLES = [
  { id: "table-2", name: "2", code: "M2", isActive: true, sortOrder: 1, branchId: BRANCH_ID },
  { id: "table-4", name: "4", code: "M4", isActive: true, sortOrder: 2, branchId: BRANCH_ID },
];

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
    holderKind: "DELIVERY",
    collectedAt: new Date().toISOString(),
    order: {
      id: "order-2",
      orderNumber: 102,
      total: "20000",
      status: "CONFIRMED",
      deliveryType: "DELIVERY",
      customerName: "Ana Ruiz",
      addressText: "Cl. 45 #12-30",
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
    tableId: "table-2",
    tableLabel: "2",
    customerName: null,
    createdAt: "2026-10-08T15:00:00.000Z",
    items: [{ name: "Pasta boloñesa", quantity: 2, lineTotal: "46000" }],
  },
  {
    id: "ord-rec-2",
    orderNumber: 1060,
    total: "27500",
    status: "READY",
    deliveryType: "PICKUP",
    paymentMethod: null,
    tableId: null,
    tableLabel: null,
    customerName: "Julián Mora",
    createdAt: "2026-10-08T15:20:00.000Z",
    items: [{ name: "Hamburguesa doble", quantity: 1, lineTotal: "27500" }],
  },
];

export async function mockCashDashboard(
  page: Page,
  options: CashMockOptions = {}
): Promise<void> {
  const {
    openSession = true,
    productImages = false,
    whatsappWindow = "WINDOW_CLOSED",
    onCreateOrder,
  } = options;
  await page.route("**/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

    if (path.endsWith(`/branches/${BRANCH_ID}/inventory`)) {
      const items = inventory(productImages);
      return json({ items, total: items.length, page: 1, limit: 100 });
    }
    if (path.endsWith(`/branches/${BRANCH_ID}/tables`)) return json(TABLES);
    if (path.endsWith(`/branches/${BRANCH_ID}`)) return json(BRANCH_DETAIL);
    if (path.endsWith("/receipt/whatsapp-window")) {
      return json({
        available: whatsappWindow === "OPEN",
        reason: whatsappWindow,
        windowExpiresAt: null,
      });
    }
    if (path.endsWith("/receipt/whatsapp") && request.method() === "POST") {
      return json({ queued: true }, 201);
    }
    if (path.endsWith("/orders") && request.method() === "POST") {
      const body = request.postDataJSON() as Record<string, unknown>;
      onCreateOrder?.(body);
      const cash = body.cash as { receivedAmount?: number } | undefined;
      return json(
        {
          orderId: "pos-order-1",
          orderNumber: "77",
          total: 26000,
          ...(body.paymentMethod === "CASH" &&
            (body.deliveryType === "COUNTER" || body.payNow === true) && {
              change: (cash?.receivedAmount ?? 26000) - 26000,
            }),
        },
        201
      );
    }

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

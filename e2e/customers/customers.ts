import { expect, type Page } from "playwright/test";
import { LoginPage } from "../pages/LoginPage";

export interface MockCustomer {
  id: string;
  name: string | null;
  phoneNumber: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

export function customer(
  orderNumber: number,
  overrides: Partial<MockCustomer> = {}
): MockCustomer {
  const now = new Date();
  return {
    id: `cust-${orderNumber}`,
    name: `Cliente ${orderNumber}`,
    phoneNumber: `+57300${String(1000000 + orderNumber)}`,
    totalOrders: 5,
    totalSpent: 250000,
    lastOrderAt: now.toISOString(),
    ...overrides,
  };
}

export function toApiCustomer(c: MockCustomer) {
  return {
    ...c,
    email: null,
    notes: null,
    isActive: true,
    businessId: "e2e-test-business-id",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export interface CustomersRequest {
  page: string | null;
  branchId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  sortBy: string | null;
  sortOrder: string | null;
}

/**
 * Mock GET /businesses/:businessId/customers (paginated list).
 * Register AFTER the generic **\/v1/** mocks — last matching route wins.
 */
export async function mockCustomers(
  page: Page,
  opts: {
    byPage?: Record<string, MockCustomer[]>;
    total?: number;
    status?: number;
    onRequest?: (req: CustomersRequest) => void;
  } = {}
): Promise<void> {
  await page.route("**/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (
      url.pathname.endsWith("/customers") &&
      !url.pathname.endsWith("/customers/metrics")
    ) {
      const pageParam = url.searchParams.get("page") ?? "1";
      opts.onRequest?.({
        page: pageParam,
        branchId: url.searchParams.get("branchId"),
        dateFrom: url.searchParams.get("dateFrom"),
        dateTo: url.searchParams.get("dateTo"),
        sortBy: url.searchParams.get("sortBy"),
        sortOrder: url.searchParams.get("sortOrder"),
      });
      if (opts.status && opts.status !== 200) {
        return route.fulfill({
          status: opts.status,
          contentType: "application/json",
          body: JSON.stringify({ message: "Error interno" }),
        });
      }
      const list = opts.byPage
        ? (opts.byPage[pageParam] ?? [])
        : [customer(1), customer(2)];
      const total = opts.total ?? list.length;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: list.map(toApiCustomer),
          meta: {
            page: Number(pageParam),
            limit: 10,
            total,
            totalPages: Math.max(1, Math.ceil(total / 10)),
          },
        }),
      });
    }
    await route.fallback();
  });
}

/** Mock GET /businesses/:businessId/customers/metrics (top charts). */
export async function mockGlobalCustomerMetrics(
  page: Page,
  body = {
    topByFrequency: [
      { customerId: "cust-1", name: "Cliente 1", phoneNumber: "+573001000001", totalOrders: 12 },
      { customerId: "cust-2", name: "Cliente 2", phoneNumber: "+573001000002", totalOrders: 8 },
    ],
    topBySpending: [
      { customerId: "cust-1", name: "Cliente 1", phoneNumber: "+573001000001", value: 1250000 },
      { customerId: "cust-2", name: "Cliente 2", phoneNumber: "+573001000002", value: 800000 },
    ],
  }
): Promise<void> {
  await page.route("**/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/customers/metrics")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    }
    await route.fallback();
  });
}

export const DETAIL_CUSTOMER_ID = "cust-detail-1";

export function detailCustomerBody() {
  return {
    ...toApiCustomer(
      customer(99, { id: DETAIL_CUSTOMER_ID, name: "Cliente Detalle" })
    ),
    email: "detalle@e2e.com",
    notes: "Nota E2E",
    addresses: [
      {
        id: "addr-1",
        label: "Casa",
        addressText: "Calle 123 #45-67",
        latitude: null,
        longitude: null,
        isDefault: true,
        customerId: DETAIL_CUSTOMER_ID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  };
}

export function detailMetricsBody() {
  return {
    totalOrders: 12,
    totalSpent: 1250000,
    avgOrderValue: 104167,
    firstOrderDate: "2026-09-01T12:00:00.000Z",
    lastOrderDate: "2026-10-06T12:00:00.000Z",
    favoriteProducts: [
      { productId: "prod-1", name: "Hamburguesa", totalQuantity: 6, totalSpent: 90000 },
    ],
  };
}

export function detailOrdersBody() {
  return {
    orders: [
      {
        id: "order-abc123",
        createdAt: "2026-10-06T12:00:00.000Z",
        status: "COMPLETED",
        paymentStatus: "PAID",
        totalAmount: 45000,
      },
    ],
    limit: 10,
    page: 1,
    total: 1,
    totalPages: 1,
  };
}

/**
 * Record PATCH /customers/:id calls (notes auto-save). The detail page
 * must not PATCH on mount — only a user edit saves.
 */
export async function recordCustomerPatches(
  page: Page,
  seen: unknown[]
): Promise<void> {
  await page.route("**/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (
      route.request().method() === "PATCH" &&
      /\/customers\/[^/]+$/.test(url.pathname)
    ) {
      let body: unknown = null;
      try {
        body = route.request().postDataJSON();
      } catch {
        body = route.request().postData();
      }
      seen.push(body);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(detailCustomerBody()),
      });
    }
    await route.fallback();
  });
}

/** Mock GET /customers/:id, /:id/metrics and /:id/orders (detail page). */
export async function mockCustomerDetail(
  page: Page,
  opts: { customer?: unknown; metrics?: unknown; orders?: unknown; status?: number } = {}
): Promise<void> {
  await page.route("**/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const match = url.pathname.match(/\/customers\/([^/]+)(\/.*)?$/);
    // List (/customers) and global metrics are handled by other mocks.
    if (!match || match[1] === "metrics") {
      return route.fallback();
    }
    if (opts.status && opts.status !== 200) {
      return route.fulfill({
        status: opts.status,
        contentType: "application/json",
        body: JSON.stringify({ message: "No encontrado" }),
      });
    }
    const suffix = match[2] ?? "";
    const body =
      suffix === "/metrics"
        ? (opts.metrics ?? detailMetricsBody())
        : suffix === "/orders"
          ? (opts.orders ?? detailOrdersBody())
          : (opts.customer ?? detailCustomerBody());
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

/**
 * Shared setup for customers specs: logs in and lands on a hydrated
 * customers page. Login itself lands on /dashboard/orders (which needs the
 * orders mocks), so specs navigate straight to /dashboard/customers.
 */
export async function openCustomers(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.fillCredentials("test@togo.com", "any-password");
  await loginPage.submit();
  await loginPage.waitForDashboardRedirect();
  await page.goto("/es/dashboard/customers");

  // Sync point: the page title means the screen hydrated.
  await expect(
    page.getByRole("heading", { name: "Gestión de Clientes" })
  ).toBeVisible();

  // Full-screen onboarding spotlight — dismiss when present.
  await page
    .getByRole("button", { name: /saltar tour/i })
    .click({ timeout: 5_000 })
    .catch(() => undefined);
  // Welcome toast floats over the header controls and steals clicks.
  await page
    .getByText("¡Bienvenido! Inicio de sesión exitoso")
    .waitFor({ state: "hidden", timeout: 15_000 })
    .catch(() => undefined);
}

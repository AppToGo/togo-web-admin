import { test, expect } from "playwright/test";
import { mockLoginSuccess } from "../helpers/mock-api";
import { mockOrdersDashboard } from "../helpers/mock-orders-api";
import { LoginPage } from "../pages/LoginPage";
import {
  openBoard,
  mockBoardPermissions,
  blockUnmockedApiCalls,
  blockRealtimeSockets,
  mockRefreshSuccess,
} from "./board";

/**
 * Permissions and completed pagination (Parte 9).
 *
 * NOTE on realtime: order-created-via-socket cannot be covered with HTTP
 * mocks — it needs a live socket.io server driving the handshake. Out of
 * scope; the socket transport is blocked in every board spec so the
 * suites stay deterministic.
 *
 *   - Without order.create there is no "Nuevo pedido" button
 *   - Completed infinite query fires paginated on mount (full scroll
 *     pagination pending the visibility-toggle product fix)
 */

function completedOrder(orderNumber: number) {
  const now = new Date().toISOString();
  return {
    id: `completed-${orderNumber}`,
    orderNumber,
    status: "COMPLETED",
    paymentStatus: "PAID",
    paymentMethod: "CASH",
    subtotal: 20000,
    tax: 0,
    total: 20000,
    totalAmount: 20000,
    customerId: "cust-e2e",
    businessId: "e2e-test-business-id",
    branchId: "e2e-test-branch-id",
    addressId: "addr-e2e",
    deliveryType: "DELIVERY",
    deliveryFee: 4000,
    createdAt: now,
    updatedAt: now,
    customer: { id: "cust-e2e", name: "Cliente E2E", phoneNumber: "+573000000000" },
    items: [{ id: "item-1", productName: "Producto E2E", quantity: 1, unitPrice: 20000 }],
  };
}

test.describe("Orders — permisos y paginación", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await blockUnmockedApiCalls(page);
    await blockRealtimeSockets(page);
    await mockLoginSuccess(page);
    await mockOrdersDashboard(page);
    await mockRefreshSuccess(page);
  });

  test("sin order.create no hay botón Nuevo pedido", async ({ page }) => {
    await mockBoardPermissions(page, ["order.view"]);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.fillCredentials("test@togo.com", "any-password");
    await loginPage.submit();
    await loginPage.waitForDashboardRedirect();

    // Board renders, but the gated action does not
    await expect(page.getByText("#101", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Nuevo pedido" })
    ).toHaveCount(0);
  });

  test("las completadas se piden paginadas al montar", async ({ page }) => {
    const requestedPages: string[] = [];
    // NOTE: full infinite-scroll pagination is blocked by a product bug —
    // the Entregada visibility toggle flips its persisted state but the
    // board never renders the column, so the archive sentinel can't be
    // reached. This pins the query wiring; the scroll half stays pending
    // on that fix.
    await mockBoardPermissions(page);
    await page.route("**/v1/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get("status") === "COMPLETED") {
        const pageParam = url.searchParams.get("page") ?? "1";
        requestedPages.push(pageParam);
        const orders = pageParam === "1" ? [completedOrder(201)] : [completedOrder(202)];
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            orders,
            total: 2,
            page: Number(pageParam),
            totalPages: 2,
            hasMore: pageParam === "1",
          }),
        });
      }
      await route.fallback();
    });
    await openBoard(page);

    // The infinite completed query fires on mount with page params
    await expect
      .poll(() => requestedPages.length, { timeout: 10_000 })
      .toBeGreaterThan(0);
    expect(requestedPages[0]).toBe("1");
  });
});

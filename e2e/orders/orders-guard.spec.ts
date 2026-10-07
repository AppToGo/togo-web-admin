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
 *   - Completed infinite query fires paginated on mount, and scrolling the
 *     Entregada column past the archive sentinel fetches the next page
 *     (regression: the sentinel observer used to miss the sentinel's
 *     (re)mount after expanding the rail, leaving pagination dead)
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

  test("el toggle Entregada muestra y oculta su columna", async ({ page }) => {
    // Regression: the visibility toggle persisted the cookie but the board
    // never rendered/removed the column.
    await mockBoardPermissions(page);
    await openBoard(page);

    // Entregada starts collapsed to a rail — expand it so the column
    // heading exists before exercising the visibility toggle.
    const rail = page
      .getByRole("button", { name: "Expandir columna" })
      .filter({ hasText: "Entregada" });
    await rail.click();

    const columnHeading = page.getByRole("heading", { name: "Entregada" });
    await expect(columnHeading).toBeVisible();

    const toggle = page
      .getByRole("button", { name: /Entregada/ })
      .filter({ hasText: "Entregada" })
      .last();
    await toggle.click();
    await expect(columnHeading).toHaveCount(0);

    await toggle.click();
    await expect(columnHeading).toBeVisible();
  });

  test("las completadas se piden paginadas al montar", async ({ page }) => {
    const requestedPages: string[] = [];
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

  test("el scroll de Entregada pide la página siguiente", async ({ page }) => {
    const requestedPages: string[] = [];
    await mockBoardPermissions(page);
    await page.route("**/v1/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get("status") === "COMPLETED") {
        const pageParam = url.searchParams.get("page") ?? "1";
        requestedPages.push(pageParam);
        // Every page reports more available so the sentinel stays armed.
        // Numbers in the 9xx range avoid colliding with the dashboard mock.
        const orders = [completedOrder(900 + Number(pageParam))];
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            orders,
            total: 30,
            page: Number(pageParam),
            totalPages: 3,
            hasMore: true,
          }),
        });
      }
      await route.fallback();
    });
    await openBoard(page);

    // Entregada starts collapsed to a rail (no sentinel) — expand it, then
    // scroll its list to the bottom so the archive sentinel fires page 2.
    const rail = page
      .getByRole("button", { name: "Expandir columna" })
      .filter({ hasText: "Entregada" });
    await rail.click();
    await expect(
      page.getByRole("heading", { name: "Entregada" })
    ).toBeVisible();

    // Scrolling the last card to the bottom of the column list brings the
    // archive sentinel into view, which fires the next page.
    await page.getByText("#901", { exact: true }).scrollIntoViewIfNeeded();

    await expect
      .poll(() => requestedPages.length, { timeout: 10_000 })
      .toBeGreaterThan(1);
    expect(requestedPages).toContain("2");
    await expect(page.getByText("#902", { exact: true })).toBeVisible();
  });
});

import { test, expect, type Page } from "playwright/test";
import { mockLoginSuccess } from "../helpers/mock-api";
import {
  mockOrdersDashboard,
  MOCK_ORDER_NUMBERS,
} from "../helpers/mock-orders-api";
import {
  openBoard,
  mockBoardPermissions,
  blockUnmockedApiCalls,
  blockRealtimeSockets,
  mockRefreshSuccess,
} from "./board";

/**
 * Orders board base rendering (Parte 1).
 *
 *   - Columns render with one mocked order per delivery mode
 *   - Empty live list shows the per-column empty state
 *   - Backend failure shows the board error state
 *   - Clicking a card opens the detail drawer
 */

const DELIVERY_DETAIL = {
  id: "delivery1",
  orderNumber: MOCK_ORDER_NUMBERS.delivery,
  status: "CONFIRMED",
  paymentStatus: "PENDING",
  paymentMethod: "CASH",
  deliveryType: "DELIVERY",
  subtotal: 20000,
  tax: 0,
  total: 20000,
  totalAmount: 20000,
  customerId: "cust-e2e",
  businessId: "e2e-test-business-id",
  branchId: "e2e-test-branch-id",
  addressId: "addr-e2e",
  address: { id: "addr-e2e", label: "Casa", addressText: "Cra 1 # 2-3" },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  customer: {
    id: "cust-e2e",
    name: "Cliente E2E",
    phoneNumber: "+573000000000",
  },
  items: [
    { id: "item-1", productName: "Producto E2E", quantity: 1, unitPrice: 20000 },
  ],
};

/**
 * Mock the order-detail fetch AFTER mockOrdersDashboard.
 * The list itself keeps coming from the base mock.
 */
async function mockOrderDetail(page: Page): Promise<void> {
  await page.route("**/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/orders/delivery1")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(DELIVERY_DETAIL),
      });
    }
    await route.fallback();
  });
}

test.describe("Orders — tablero base", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    // Block-all first: lowest precedence, catches only what no mock handles
    await blockUnmockedApiCalls(page);
    await blockRealtimeSockets(page);
    await mockLoginSuccess(page);
    await mockOrdersDashboard(page);
    await mockBoardPermissions(page);
    await mockRefreshSuccess(page);
  });

  test("muestra las columnas con un pedido por modalidad", async ({ page }) => {
    await openBoard(page);

    // Column for new orders + one card per delivery mode
    await expect(
      page.getByRole("heading", { name: "Nueva" })
    ).toBeVisible();
    await expect(page.getByText("#101", { exact: true })).toBeVisible();
    await expect(page.getByText("#102", { exact: true })).toBeVisible();
    await expect(page.getByText("#103", { exact: true })).toBeVisible();
  });

  test("lista vacía muestra el estado Sin órdenes", async ({ page }) => {
    await page.route("**/v1/**", async (route) => {
      const url = new URL(route.request().url());
      if (
        url.pathname.endsWith("/orders") &&
        !url.searchParams.get("status")
      ) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      }
      await route.fallback();
    });
    await openBoard(page);

    await expect(
      page.getByRole("button", { name: "Nuevo pedido" })
    ).toBeVisible();
    await expect(page.getByText("Sin órdenes").first()).toBeVisible();
  });

  test("error del backend muestra el estado de error", async ({ page }) => {
    await page.route("**/v1/**", async (route) => {
      const url = new URL(route.request().url());
      if (
        url.pathname.endsWith("/orders") &&
        !url.searchParams.get("status")
      ) {
        return route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ message: "DB down" }),
        });
      }
      await route.fallback();
    });
    await openBoard(page);

    // React Query retries the failed query 3 times with backoff before
    // surfacing the error state
    await expect(
      page.getByRole("heading", { name: "Error al cargar órdenes" })
    ).toBeVisible({ timeout: 25_000 });
  });

  test("click en la tarjeta abre el detalle", async ({ page }) => {
    await mockOrderDetail(page);
    await openBoard(page);

    await page.getByText("#101", { exact: true }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 8_000 });
    await expect(dialog.getByText("Cliente E2E").first()).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });
});

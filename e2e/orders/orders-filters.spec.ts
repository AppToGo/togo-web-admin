import { test, expect } from "playwright/test";
import { mockLoginSuccess } from "../helpers/mock-api";
import { mockOrdersDashboard } from "../helpers/mock-orders-api";
import {
  openBoard,
  mockBoardPermissions,
  blockUnmockedApiCalls,
  blockRealtimeSockets,
  mockRefreshSuccess,
} from "./board";

/**
 * Search, filters and views (Parte 7).
 *
 *   - Text search narrows by order number and reports no matches
 *   - Delivery switch hides/shows independently (mirrors the dine-in test)
 *   - List view swaps the Kanban for grouped rows
 *   - Clearing branch selection empties the board; reselecting restores it
 */

test.describe("Orders — búsqueda, filtros y vistas", () => {
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
    await mockBoardPermissions(page);
    await mockRefreshSuccess(page);
  });

  test("buscar por número filtra las tarjetas", async ({ page }) => {
    await openBoard(page);

    const search = page.getByPlaceholder(/buscar por orden/i);
    await search.fill("101");

    await expect(page.getByText("#101", { exact: true })).toBeVisible();
    await expect(page.getByText("#102", { exact: true })).toHaveCount(0);
    await expect(page.getByText("#103", { exact: true })).toHaveCount(0);

    await search.fill("");
    await expect(page.getByText("#102", { exact: true })).toBeVisible();
    await expect(page.getByText("#103", { exact: true })).toBeVisible();
  });

  test("buscar sin coincidencias muestra Sin órdenes", async ({ page }) => {
    await openBoard(page);

    await page.getByPlaceholder(/buscar por orden/i).fill("zzz-no-existe");

    await expect(page.getByText("#101", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Sin órdenes").first()).toBeVisible();
  });

  test("apagar Domicilio oculta solo ese pedido", async ({ page }) => {
    await openBoard(page);

    await page.locator('[data-tour-step="filters"]').click();
    const deliverySwitch = page
      .locator("label", { hasText: "Domicilio" })
      .getByRole("switch");
    await expect(deliverySwitch).toBeVisible();

    await deliverySwitch.click();
    await expect(page.getByText("#101", { exact: true })).toHaveCount(0);
    await expect(page.getByText("#102", { exact: true })).toBeVisible();
    await expect(page.getByText("#103", { exact: true })).toBeVisible();

    await deliverySwitch.click();
    await expect(page.getByText("#101", { exact: true })).toBeVisible();
  });

  test("la vista lista reemplaza el kanban", async ({ page }) => {
    await openBoard(page);

    // View switcher options carry explicit tab roles + labels
    await page.getByRole("tab", { name: "Lista agrupada" }).click();

    // Grouped rows keep the data, Kanban column headers are gone
    await expect(page.getByText("#101", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nueva" })).toHaveCount(0);
  });

  test("cambiar de sucursal filtra el tablero y volver lo restaura", async ({
    page,
  }) => {
    const now = new Date().toISOString();
    const orderFor = (id: string, orderNumber: number, deliveryType: string) => ({
      id,
      orderNumber,
      status: "CONFIRMED",
      paymentStatus: "PENDING",
      subtotal: 20000,
      tax: 0,
      total: 20000,
      totalAmount: 20000,
      customerId: "cust-e2e",
      businessId: "e2e-test-business-id",
      branchId: "e2e-test-branch-id",
      deliveryType,
      createdAt: now,
      updatedAt: now,
      customer: { id: "cust-e2e", name: "Cliente E2E", phoneNumber: "+573000000000" },
      items: [{ id: "item-1", productName: "Producto E2E", quantity: 1, unitPrice: 20000 }],
    });
    const ALL_ORDERS = [
      orderFor("delivery1", 101, "DELIVERY"),
      orderFor("pickup01", 102, "PICKUP"),
      orderFor("dinein01", 103, "DINE_IN"),
    ];

    // The selector only renders with 2+ branches, and the list mock
    // filters by branchIds like the backend would.
    await page.route("**/v1/**", async (route) => {
      const url = new URL(route.request().url());
      const json = (body: unknown, status = 200) =>
        route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
      if (url.pathname.endsWith("/auth/session")) {
        return json({
          defaultBranchId: "e2e-test-branch-id",
          branches: [
            { id: "e2e-test-branch-id", name: "Sede Centro", isMainBranch: true, role: "OWNER" },
            { id: "e2e-branch-norte", name: "Sucursal Norte", isMainBranch: false, role: "OWNER" },
          ],
          business: { id: "e2e-test-business-id", name: "Test Business", plan: "PRO", maxBranches: 5 },
          userPreferences: { defaultBranchId: "e2e-test-branch-id" },
        });
      }
      if (url.pathname.endsWith("/branches")) {
        return json([
          { id: "e2e-test-branch-id", businessId: "e2e-test-business-id", name: "Sede Centro", isMainBranch: true, isActive: true },
          { id: "e2e-branch-norte", businessId: "e2e-test-business-id", name: "Sucursal Norte", isMainBranch: false, isActive: true },
        ]);
      }
      if (url.pathname.endsWith("/orders") && !url.searchParams.get("status")) {
        const ids = url.searchParams.getAll("branchIds");
        const mine = ids.length > 0 ? ids : ["e2e-test-branch-id"];
        return json(ALL_ORDERS.filter((o) => mine.includes(o.branchId as string)));
      }
      await route.fallback();
    });
    await openBoard(page);

    // The trigger carries no accessible name — locate by visible text.
    // The selector toggles: check Norte AND uncheck Centro to isolate it.
    await page
      .getByRole("combobox")
      .filter({ hasText: "Sede Centro" })
      .click();
    await page.getByRole("option", { name: "Sucursal Norte" }).click();
    await page.getByRole("option", { name: "Sede Centro" }).click();
    await page.keyboard.press("Escape");

    // Sucursal Norte has no orders — empty columns, board stays up
    await expect(page.getByText("#101", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Sin órdenes").first()).toBeVisible();

    await page
      .getByRole("combobox")
      .filter({ hasText: "Sucursal Norte" })
      .click();
    await page.getByRole("option", { name: "Sede Centro" }).click();
    await page.getByRole("option", { name: "Sucursal Norte" }).click();
    await page.keyboard.press("Escape");

    await expect(page.getByText("#101", { exact: true })).toBeVisible({
      timeout: 8_000,
    });
  });
});

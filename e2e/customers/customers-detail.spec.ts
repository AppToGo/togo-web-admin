import { test, expect } from "playwright/test";
import { mockLoginSuccess } from "../helpers/mock-api";
import { mockBranches } from "../dashboard/dashboard";
import {
  openCustomers,
  mockCustomers,
  mockGlobalCustomerMetrics,
  mockCustomerDetail,
  recordCustomerPatches,
  DETAIL_CUSTOMER_ID,
} from "./customers";
import {
  blockUnmockedApiCalls,
  blockRealtimeSockets,
  mockRefreshSuccess,
  mockBoardPermissions,
} from "../orders/board";
import { LoginPage } from "../pages/LoginPage";
import type { Page } from "playwright/test";

/**
 * Customer detail (Parte 4): navigation from the row, header, metrics,
 * order history, favorites, addresses and the not-found state.
 *
 * NOTE: the conversations section is intentionally not asserted — it reads
 * the inbox cache/transport covered by the inbox specs.
 */

async function openDetail(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.fillCredentials("test@togo.com", "any-password");
  await loginPage.submit();
  await loginPage.waitForDashboardRedirect();
  await page.goto(`/es/dashboard/customers/${DETAIL_CUSTOMER_ID}`);
  await expect(
    page.getByRole("heading", { name: "Cliente Detalle" })
  ).toBeVisible();
}

test.describe("Clientes — detalle", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await blockUnmockedApiCalls(page);
    await blockRealtimeSockets(page);
    await mockLoginSuccess(page);
    await mockBranches(page);
    await mockCustomers(page);
    await mockGlobalCustomerMetrics(page);
    await mockCustomerDetail(page);
    await mockRefreshSuccess(page);
    await mockBoardPermissions(page);
  });

  test("se abre desde la acción de la fila", async ({ page }) => {
    await openCustomers(page);

    const table = page.getByRole("table");
    await expect(table.getByText("Cliente 1")).toBeVisible();
    await table
      .getByRole("button", { name: "Ver detalle" })
      .first()
      .click();

    await expect(page).toHaveURL(/\/dashboard\/customers\/.+/);
    await expect(
      page.getByRole("heading", { name: "Cliente Detalle" })
    ).toBeVisible();
  });

  test("muestra cabecera, métricas, pedidos, favoritos y dirección", async ({
    page,
  }) => {
    await openDetail(page);

    // Header: name, phone, email.
    await expect(
      page.getByRole("heading", { name: "Cliente Detalle" })
    ).toBeVisible();
    await expect(page.getByText("+573001000099")).toBeVisible();
    await expect(page.getByText("detalle@e2e.com")).toBeVisible();

    // The metric/order/favorite sections lazy-load on scroll (their titles
    // only exist once data arrives), so drive the inner scroller to the
    // bottom first and assert afterwards (two nested <main> exist; hover
    // the heading inside the scrollable one before wheeling).
    await page.getByRole("heading", { name: "Cliente Detalle" }).hover();
    await page.mouse.wheel(0, 4000);

    // Metrics.
    await expect(page.getByText("Total gastado", { exact: true })).toBeVisible();
    await expect(page.getByText("$ 1.250.000")).toBeVisible();
    await expect(page.getByText("Total pedidos", { exact: true })).toBeVisible();

    // Order history.
    await expect(page.getByText("ABC123")).toBeVisible();
    await expect(page.getByText("Completado", { exact: true })).toBeVisible();
    await expect(page.getByText("Pagado", { exact: true })).toBeVisible();

    // Favorites + address.
    await expect(page.getByText("Productos favoritos")).toBeVisible();
    await expect(page.getByText("Hamburguesa")).toBeVisible();
    await expect(page.getByText("6 veces pedido")).toBeVisible();
    await expect(page.getByText("Calle 123 #45-67")).toBeVisible();
  });

  test("abrir el detalle no dispara PATCH sin edición", async ({
    page,
  }) => {
    // Regression: the notes auto-save mistook the initial "" for a user
    // edit and PATCHed (wiping notes) with just opening the detail,
    // spamming updateSuccess toasts.
    const patches: unknown[] = [];
    await recordCustomerPatches(page, patches);
    await openDetail(page);

    // Debounce window (1s) plus margin: no save may fire without edits.
    await page.waitForTimeout(2500);
    expect(patches).toHaveLength(0);
  });

  test("cliente inexistente muestra no encontrado y vuelve", async ({
    page,
  }) => {
    await mockCustomerDetail(page, { status: 404 });

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.fillCredentials("test@togo.com", "any-password");
    await loginPage.submit();
    await loginPage.waitForDashboardRedirect();
    await page.goto(`/es/dashboard/customers/${DETAIL_CUSTOMER_ID}`);

    await expect(page.getByText("Cliente no encontrado")).toBeVisible();
    await page.getByRole("link", { name: "Volver" }).click();
    await expect(page).toHaveURL(/\/dashboard\/customers\/?$/);
    await expect(
      page.getByRole("heading", { name: "Gestión de Clientes" })
    ).toBeVisible();
  });
});

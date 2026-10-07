import { test, expect } from "playwright/test";
import { mockLoginSuccess } from "../helpers/mock-api";
import { mockBranches } from "../dashboard/dashboard";
import { openCustomers, mockCustomers, mockGlobalCustomerMetrics, customer } from "./customers";
import {
  blockUnmockedApiCalls,
  blockRealtimeSockets,
  mockRefreshSuccess,
  mockBoardPermissions,
} from "../orders/board";

/**
 * Customers list (Parte 1): header, rows, pagination and empty state.
 */

test.describe("Clientes — lista y tabla", () => {
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
    await mockRefreshSuccess(page);
    await mockBoardPermissions(page);
  });

  test("muestra el encabezado y las filas con sus datos", async ({
    page,
  }) => {
    await openCustomers(page);

    await expect(
      page.getByRole("heading", { name: "Gestión de Clientes" })
    ).toBeVisible();
    await expect(
      page.getByText("Administra y conoce a tus clientes")
    ).toBeVisible();

    // Row texts also appear in the top-charts links — scope to the table.
    const table = page.getByRole("table");
    await expect(table.getByText("Cliente 1")).toBeVisible();
    await expect(table.getByText("+573001000001")).toBeVisible();
    await expect(table.getByText("Cliente 2")).toBeVisible();
    // totalSpent 250.000 COP renders twice (one row each).
    await expect(table.getByText("250.000")).toHaveCount(2);
  });

  test("la última compra se muestra relativa", async ({ page }) => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await mockCustomers(page, {
      byPage: {
        "1": [
          customer(1, { lastOrderAt: new Date().toISOString() }),
          customer(2, { lastOrderAt: yesterday.toISOString() }),
        ],
      },
    });
    await openCustomers(page);

    const table = page.getByRole("table");
    await expect(table.getByText("Hoy", { exact: true })).toBeVisible();
    await expect(table.getByText("Ayer", { exact: true })).toBeVisible();
  });

  test("paginar pide la página siguiente", async ({ page }) => {
    const seenPages: (string | null)[] = [];
    await mockCustomers(page, {
      byPage: { "1": [customer(1)], "2": [customer(2)] },
      total: 12,
      onRequest: (req) => seenPages.push(req.page),
    });
    await openCustomers(page);

    const table = page.getByRole("table");
    await expect(table.getByText("Cliente 1")).toBeVisible();
    await page.getByRole("button", { name: "Siguiente" }).click();

    await expect
      .poll(() => seenPages.length, { timeout: 10_000 })
      .toBeGreaterThan(1);
    expect(seenPages.at(-1)).toBe("2");
    await expect(table.getByText("Cliente 2")).toBeVisible();
  });

  test("sin clientes muestra el vacío", async ({ page }) => {
    await mockCustomers(page, { byPage: { "1": [] }, total: 0 });
    await openCustomers(page);

    await expect(page.getByText("No hay clientes")).toBeVisible();
    await expect(
      page.getByText("Los clientes aparecerán aquí cuando realicen su primera compra")
    ).toBeVisible();
  });

  test("cliente sin nombre muestra Sin nombre", async ({ page }) => {
    await mockCustomers(page, {
      byPage: { "1": [customer(1, { name: null })] },
    });
    await openCustomers(page);

    // Scoped to the table: the top-charts links render their own fallback.
    // Regression: the column used the missing `table.anonymous` key and
    // painted it raw; the table owns `table.noName` ("Sin nombre").
    await expect(
      page.getByRole("table").getByText("Sin nombre")
    ).toBeVisible();
  });
});

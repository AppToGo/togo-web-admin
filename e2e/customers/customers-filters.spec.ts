import { test, expect } from "playwright/test";
import { mockLoginSuccess } from "../helpers/mock-api";
import { mockBranches } from "../dashboard/dashboard";
import {
  openCustomers,
  mockCustomers,
  mockGlobalCustomerMetrics,
  customer,
  type CustomersRequest,
} from "./customers";
import {
  blockUnmockedApiCalls,
  blockRealtimeSockets,
  mockRefreshSuccess,
  mockBoardPermissions,
} from "../orders/board";

/**
 * Customers filters and sorting (Parte 2): date presets and branch scope
 * refetch with query params; column sorting reorders client-side.
 */

test.describe("Clientes — filtros y orden", () => {
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

  test("cambiar de preset pide clientes con el rango nuevo", async ({
    page,
  }) => {
    const seen: CustomersRequest[] = [];
    await mockCustomers(page, { onRequest: (req) => seen.push(req) });
    await openCustomers(page);

    await expect
      .poll(() => seen.length, { timeout: 10_000 })
      .toBeGreaterThan(0);
    const initial = seen[0];
    // Date params always travel (global filter merged into the query).
    expect(initial.dateFrom).toBeTruthy();
    expect(initial.dateTo).toBeTruthy();

    await page.getByRole("button", { name: /Hoy/ }).first().click();
    await page.getByRole("button", { name: "Ayer" }).click();

    await expect
      .poll(() => seen.length, { timeout: 10_000 })
      .toBeGreaterThan(1);
    const latest = seen.at(-1)!;
    expect(latest.dateFrom).toBe(latest.dateTo);
    expect(latest.dateFrom).not.toBe(initial.dateFrom);
  });

  test("filtrar por sede pide clientes con branchId", async ({ page }) => {
    const seen: CustomersRequest[] = [];
    await mockCustomers(page, { onRequest: (req) => seen.push(req) });
    await openCustomers(page);

    await expect
      .poll(() => seen.length, { timeout: 10_000 })
      .toBeGreaterThan(0);
    expect(seen[0].branchId).toBeNull();

    await page.getByRole("button", { name: "Todas las sedes" }).click();
    await page.getByRole("button", { name: /Sede Norte/ }).click();
    await page.keyboard.press("Escape");

    await expect
      .poll(() => seen.at(-1)?.branchId, { timeout: 10_000 })
      .toBe("branch-norte");
  });

  test("ordenar por nombre reordena las filas", async ({ page }) => {
    await mockCustomers(page, {
      byPage: {
        "1": [customer(3, { name: "Cliente C" }), customer(1, { name: "Cliente A" })],
      },
    });
    await openCustomers(page);

    const table = page.getByRole("table");
    const firstRow = () => table.getByRole("row").nth(1);
    await expect(firstRow()).toContainText("Cliente C");

    await table.getByRole("button", { name: "Nombre" }).click();
    await expect(firstRow()).toContainText("Cliente A");

    await table.getByRole("button", { name: "Nombre" }).click();
    await expect(firstRow()).toContainText("Cliente C");
  });
});

import { test, expect } from "playwright/test";
import { mockLoginSuccess } from "../helpers/mock-api";
import { mockBranches } from "../dashboard/dashboard";
import { openCustomers, mockCustomers, mockGlobalCustomerMetrics } from "./customers";
import {
  blockUnmockedApiCalls,
  blockRealtimeSockets,
  mockRefreshSuccess,
  mockBoardPermissions,
} from "../orders/board";

/**
 * Customers selection (Parte 3): row checkboxes, select-all and the
 * selection bar with its clear and select-all-pages actions.
 */

test.describe("Clientes — selección", () => {
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

  test("seleccionar una fila muestra la barra y se limpia", async ({
    page,
  }) => {
    await openCustomers(page);

    const table = page.getByRole("table");
    await expect(
      page.getByText("cliente(s) seleccionado(s)")
    ).toHaveCount(0);

    await table.getByRole("checkbox", { name: "Seleccionar fila" }).first().click();
    await expect(
      page.getByText("1 cliente(s) seleccionado(s)")
    ).toBeVisible();

    await page.getByRole("button", { name: "Limpiar selección" }).click();
    await expect(
      page.getByText("cliente(s) seleccionado(s)")
    ).toHaveCount(0);
  });

  test("seleccionar todos ofrece todas las páginas", async ({ page }) => {
    await mockCustomers(page, { total: 12 });
    await openCustomers(page);

    await page
      .getByRole("checkbox", { name: "Seleccionar todos" })
      .click();
    await expect(
      page.getByText("2 cliente(s) seleccionado(s)")
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Seleccionar todos los 12 clientes" })
      .click();
    await expect(page.getByText("Seleccionaste todos")).toBeVisible();
  });
});

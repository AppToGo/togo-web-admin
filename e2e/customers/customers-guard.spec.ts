import { test, expect } from "playwright/test";
import { mockLoginSuccess } from "../helpers/mock-api";
import { mockBranches } from "../dashboard/dashboard";
import {
  openCustomers,
  mockCustomers,
  mockGlobalCustomerMetrics,
  mockCustomerDetail,
} from "./customers";
import {
  blockUnmockedApiCalls,
  blockRealtimeSockets,
  mockRefreshSuccess,
  mockBoardPermissions,
} from "../orders/board";
import { LoginPage } from "../pages/LoginPage";

/**
 * Customers top charts, guard and errors (Parte 6): global top lists and
 * their navigation, the no-business screen, and the API-outage behavior.
 *
 * NOTE (product gap, not blocking): on API error the table falls back to
 * the empty state — error and "no customers yet" are indistinguishable and
 * the `notifications.loadError` key is dead. The test below pins that the
 * layout survives; telling the states apart needs product work.
 */

test.describe("Clientes — tops, guard y errores", () => {
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

  test("los tops muestran listas y navegan al detalle", async ({ page }) => {
    await openCustomers(page);

    await expect(
      page.getByText("Top 10 - Más frecuentes", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Top 10 - Más gastaron", { exact: true })
    ).toBeVisible();

    await page
      .getByRole("link", { name: "Cliente 1 +573001000001" })
      .first()
      .click();
    await expect(page).toHaveURL(/\/dashboard\/customers\/.+/);
    await expect(
      page.getByRole("heading", { name: "Cliente Detalle" })
    ).toBeVisible();
  });

  test("tops vacíos muestran su vacío", async ({ page }) => {
    await mockGlobalCustomerMetrics(page, {
      topByFrequency: [],
      topBySpending: [],
    });
    await openCustomers(page);

    await expect(page.getByText("No hay datos")).toBeVisible();
    await expect(
      page.getByText("No encontramos datos para este periodo.")
    ).toBeVisible();
  });

  test("sin negocio muestra su pantalla (no el vacío de lista)", async ({
    page,
  }) => {
    await page.context().clearCookies();
    await blockUnmockedApiCalls(page);
    await blockRealtimeSockets(page);
    await mockLoginSuccess(page, { businessId: "" });
    await mockBranches(page);
    await mockCustomers(page);
    await mockGlobalCustomerMetrics(page);
    await mockCustomerDetail(page);
    await mockRefreshSuccess(page);
    // The AuthProvider refresh would restore businessId — override it too.
    await page.route("**/api/auth/refresh", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "e2e-fake-access-token",
          refresh_token: "e2e-fake-refresh-token",
          expires_in: 3600,
          user: {
            userId: "e2e-test-user-id",
            email: "test@togo.com",
            name: "Test User",
            role: "ADMIN",
            businessId: "",
            businessName: "",
            operatorProfileId: null,
            subscriptionPlan: 1,
          },
        }),
      })
    );
    await mockBoardPermissions(page);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.fillCredentials("test@togo.com", "any-password");
    await loginPage.submit();
    await loginPage.waitForDashboardRedirect();
    await page.goto("/es/dashboard/customers");

    // Same title as the list empty state, but without its description.
    await expect(page.getByText("No hay clientes")).toBeVisible();
    await expect(
      page.getByText("Los clientes aparecerán aquí cuando realicen su primera compra")
    ).toHaveCount(0);
  });

  test("api caída no rompe la pantalla", async ({ page }) => {
    await mockCustomers(page, { status: 500 });
    await openCustomers(page);

    await expect(
      page.getByRole("heading", { name: "Gestión de Clientes" })
    ).toBeVisible({ timeout: 20_000 });
  });
});

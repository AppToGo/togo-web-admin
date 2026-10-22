import { test, expect } from "playwright/test";
import { mockLoginSuccess } from "../helpers/mock-api";
import {
  blockUnmockedApiCalls,
  blockRealtimeSockets,
  mockRefreshSuccess,
} from "../orders/board";
import { LoginPage } from "../pages/LoginPage";

/**
 * Filtro por sede en productos (sección catálogo).
 *
 * El selector estaba cableado a no-ops: abría, mostraba las sedes, pero el
 * click no hacía nada y siempre quedaba "Todas las sedes".
 * Con el backend `branchId + activationStatus` y la página cableada:
 * elegir una sede filtra la lista a sus productos activados.
 */

const BRANCH_A = "e2e-branch-centro";
const BRANCH_B = "e2e-branch-norte";

const P_ACTIVATED = {
  id: "prod-1",
  businessId: "e2e-test-business-id",
  name: "Producto Sede Norte",
  slug: "producto-sede-norte",
  isActive: true,
  isFeatured: false,
  searchKeywords: [],
  variantCount: 1,
  priceFrom: 10000,
  priceTo: 10000,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const P_NOT_ACTIVATED = {
  ...P_ACTIVATED,
  id: "prod-2",
  name: "Producto Solo Centro",
  slug: "producto-solo-centro",
};

test.describe("Productos — filtro por sede", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await blockUnmockedApiCalls(page);
    await blockRealtimeSockets(page);
    await mockLoginSuccess(page);
    await mockRefreshSuccess(page);

    await page.route("**/v1/**", async (route) => {
      const url = new URL(route.request().url());
      const json = (body: unknown, status = 200) =>
        route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
      if (url.pathname.endsWith("/auth/session")) {
        return json({
          defaultBranchId: BRANCH_A,
          branches: [
            { id: BRANCH_A, name: "Sede Centro", isMainBranch: true, role: "OWNER" },
            { id: BRANCH_B, name: "Sucursal Norte", isMainBranch: false, role: "OWNER" },
          ],
          business: { id: "e2e-test-business-id", name: "Test Business", plan: "PRO", maxBranches: 5 },
          userPreferences: { defaultBranchId: BRANCH_A },
        });
      }
      if (url.pathname.endsWith("/business-categories")) {
        return json([]);
      }
      if (/\/products$/.test(url.pathname)) {
        const branchId = url.searchParams.get("branchId");
        const activationStatus = url.searchParams.get("activationStatus");
        const inBranch =
          branchId === BRANCH_B
            ? [{ ...P_ACTIVATED, branchInfo: { isActivated: true, isAvailable: true } }]
            : [P_ACTIVATED, P_NOT_ACTIVATED];
        const items =
          activationStatus === "activated"
            ? inBranch.filter((p) => "branchInfo" in p)
            : activationStatus === "not_activated"
              ? inBranch.filter((p) => !("branchInfo" in p))
              : inBranch;
        return json({ items, total: items.length, page: 1, limit: 20, counts: { total: 2, fromTemplate: 0, custom: 2 } });
      }
      await route.fallback();
    });

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.fillCredentials("test@togo.com", "any-password");
    await loginPage.submit();
  });

  test("elegir una sede filtra la lista a sus productos", async ({ page }) => {
    await page.goto("/es/dashboard/catalog/products");
    await expect(page.getByText("Producto Sede Norte").first()).toBeVisible();
    await expect(page.getByText("Producto Solo Centro").first()).toBeVisible();

    // El trigger muestra "Todas las sedes"; elegir Sucursal Norte filtra.
    // Las opciones viven en el popover (role=dialog); el trigger comparte
    // el mismo nombre accesible una vez seleccionado.
    const popover = page.locator('[role="dialog"]');
    await page.getByRole("button", { name: "Todas las sedes" }).click();
    await popover.getByRole("button", { name: "Sucursal Norte" }).click();

    await expect(page.getByText("Producto Sede Norte").first()).toBeVisible();
    await expect(page.getByText("Producto Solo Centro")).toHaveCount(0);

    // Cerrar el popover y volver a "Todas": restaura la lista completa.
    await page.keyboard.press("Escape");
    await expect(popover).toHaveCount(0);
    await page
      .locator('button[aria-haspopup="dialog"]', { hasText: "Sucursal Norte" })
      .click();
    await popover.getByRole("button", { name: "Todas las sedes" }).click();

    await expect(page.getByText("Producto Solo Centro").first()).toBeVisible();
  });
});

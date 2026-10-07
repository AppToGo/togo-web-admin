import { test, expect } from "playwright/test";
import { mockLoginSuccess } from "../helpers/mock-api";
import {
  openDashboard,
  mockDashboardMetrics,
  mockBranches,
} from "./dashboard";
import {
  blockUnmockedApiCalls,
  blockRealtimeSockets,
  mockRefreshSuccess,
  mockBoardPermissions,
} from "../orders/board";

/**
 * Dashboard guard and errors (Parte 6): unauthenticated redirect, metrics
 * outage degrading to zeros without breaking the layout, and the branch
 * selector error state.
 */

test.describe("Dashboard — guard y errores", () => {
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
    await mockDashboardMetrics(page);
    await mockRefreshSuccess(page);
    await mockBoardPermissions(page);
  });

  test("sin sesión redirige al login", async ({ page }) => {
    await page.goto("/es/dashboard");
    await page.waitForURL(/\/es\/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/es\/login/);
  });

  test("métricas caídas degradan a ceros sin romper el layout", async ({
    page,
  }) => {
    await mockDashboardMetrics(page, { status: 500 });
    await openDashboard(page);

    // The header and cards still render (React Query retries first, so
    // allow extra time for the error state to settle).
    await expect(
      page.getByRole("heading", { name: "¡Hola, Test User!" })
    ).toBeVisible();
    await expect(page.getByText("Órdenes Hoy", { exact: true })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText("0 completadas")).toBeVisible({
      timeout: 20_000,
    });
  });

  test("sedes caídas muestran el error del selector", async ({ page }) => {
    // Regression: the `showBranchSelector` early-return ran before the
    // error/empty states, so with a failed session (0 branches) the
    // selector rendered nothing instead of the error.
    await mockBranches(page, { status: 500 });
    await openDashboard(page);

    await expect(
      page.getByText("Error al cargar las sucursales")
    ).toBeVisible({ timeout: 20_000 });
  });

  test("sin sedes muestra el vacío del selector", async ({ page }) => {
    await mockBranches(page, { branches: [] });
    await openDashboard(page);

    await expect(
      page.getByText("No hay sedes disponibles")
    ).toBeVisible({ timeout: 20_000 });
  });
});

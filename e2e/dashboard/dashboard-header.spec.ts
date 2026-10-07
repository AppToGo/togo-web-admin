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
 * Dashboard header (Parte 1): greeting, branch selector and date presets.
 * Everything else on the page is covered by its own part.
 */

test.describe("Dashboard — encabezado y filtros", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    // Hardening (same rationale as orders/board.ts): unmocked calls 401
    // the fake token and bounce the session; the socket loops refresh.
    await blockUnmockedApiCalls(page);
    await blockRealtimeSockets(page);
    await mockLoginSuccess(page);
    await mockBranches(page);
    await mockDashboardMetrics(page);
    await mockRefreshSuccess(page);
    await mockBoardPermissions(page);
  });

  test("saluda al usuario y muestra su negocio", async ({ page }) => {
    await openDashboard(page);

    await expect(
      page.getByRole("heading", { name: "¡Hola, Test User!" })
    ).toBeVisible();
    await expect(page.getByText("Bienvenido a Test Business.")).toBeVisible();
  });

  test("sin negocio asignado muestra el mensaje genérico", async ({ page }) => {
    await page.context().clearCookies();
    await blockUnmockedApiCalls(page);
    await blockRealtimeSockets(page);
    await mockLoginSuccess(page, { businessName: "" });
    await mockBranches(page);
    await mockDashboardMetrics(page);
    await mockRefreshSuccess(page);
    // The AuthProvider refreshes on load and would restore businessName —
    // override it too (last matching route wins).
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
            businessId: "e2e-test-business-id",
            businessName: "",
            operatorProfileId: null,
            subscriptionPlan: 1,
          },
        }),
      })
    );
    await mockBoardPermissions(page);
    await openDashboard(page);

    await expect(
      page.getByRole("heading", { name: "¡Hola, Test User!" })
    ).toBeVisible();
    await expect(
      page.getByText("Bienvenido a tu dashboard.")
    ).toBeVisible();
  });

  test("el selector de sede lista y aplica la sede", async ({ page }) => {
    const seenBranchIds: (string | null)[] = [];
    await mockDashboardMetrics(page, {
      onRequest: (req) => seenBranchIds.push(req.branchIds),
    });
    await openDashboard(page);

    const trigger = page.getByRole("button", { name: "Todas las sedes" });
    await expect(trigger).toBeVisible();
    await trigger.click();

    await expect(
      page.getByRole("button", { name: /Sede Centro/ })
    ).toBeVisible();
    await page.getByRole("button", { name: /Sede Norte/ }).click();
    await page.keyboard.press("Escape");

    // The trigger now shows the selection …
    await expect(
      page.getByRole("button", { name: "Sede Norte" })
    ).toBeVisible();
    // … and metrics refetch scoped to that branch.
    await expect
      .poll(() => seenBranchIds.length, { timeout: 10_000 })
      .toBeGreaterThan(1);
    expect(seenBranchIds.at(-1)).toBe("branch-norte");
  });

  test("los presets de fecha se ofrecen y aplican", async ({ page }) => {
    await openDashboard(page);

    const trigger = page.getByRole("button", { name: /Hoy/ }).first();
    await expect(trigger).toBeVisible();
    await trigger.click();

    for (const label of [
      "Ayer",
      "Esta semana",
      "Últimos 7 días",
      "Este mes",
      "Personalizado",
    ]) {
      await expect(
        page.getByRole("button", { name: label })
      ).toBeVisible();
    }

    await page.getByRole("button", { name: "Últimos 7 días" }).click();
    await expect(
      page.getByRole("button", { name: "Últimos 7 días" }).first()
    ).toBeVisible();
  });
});

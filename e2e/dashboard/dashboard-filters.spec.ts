import { test, expect } from "playwright/test";
import { mockLoginSuccess } from "../helpers/mock-api";
import {
  openDashboard,
  mockDashboardMetrics,
  mockBranches,
  type MetricsRequest,
} from "./dashboard";
import {
  blockUnmockedApiCalls,
  blockRealtimeSockets,
  mockRefreshSuccess,
  mockBoardPermissions,
} from "../orders/board";

/**
 * Dashboard filters applied to data (Parte 5): changing the date preset or
 * the branch refetches /orders/metrics with the matching query params.
 * (Branch selection itself is covered in Parte 1; here the params are
 * asserted for both filters.)
 */

test.describe("Dashboard — filtros aplicados a datos", () => {
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

  test("cambiar de preset pide métricas con el rango nuevo", async ({
    page,
  }) => {
    const seen: MetricsRequest[] = [];
    await mockDashboardMetrics(page, {
      onRequest: (req) => seen.push(req),
    });
    await openDashboard(page);

    await expect
      .poll(() => seen.length, { timeout: 10_000 })
      .toBeGreaterThan(0);
    const initial = seen[0];

    await page.getByRole("button", { name: /Hoy/ }).first().click();
    await page.getByRole("button", { name: "Ayer" }).click();

    // A single-day preset sends from == to, different from today's range.
    await expect
      .poll(() => seen.length, { timeout: 10_000 })
      .toBeGreaterThan(1);
    const latest = seen.at(-1)!;
    expect(latest.dateFrom).toBe(latest.dateTo);
    expect(latest.dateFrom).not.toBe(initial.dateFrom);
  });

  test("cambiar de sede pide métricas con branchIds", async ({ page }) => {
    const seen: MetricsRequest[] = [];
    await mockDashboardMetrics(page, {
      onRequest: (req) => seen.push(req),
    });
    await openDashboard(page);

    await expect
      .poll(() => seen.length, { timeout: 10_000 })
      .toBeGreaterThan(0);
    expect(seen[0].branchIds).toBeNull();

    await page.getByRole("button", { name: "Todas las sedes" }).click();
    await page.getByRole("button", { name: /Sede Centro/ }).click();
    await page.keyboard.press("Escape");

    await expect
      .poll(() => seen.at(-1)?.branchIds, { timeout: 10_000 })
      .toBe("branch-centro");
  });
});

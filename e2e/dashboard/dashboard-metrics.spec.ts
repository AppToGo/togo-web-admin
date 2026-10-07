import { test, expect } from "playwright/test";
import { mockLoginSuccess } from "../helpers/mock-api";
import {
  openDashboard,
  mockDashboardMetrics,
  mockBranches,
  defaultMetricsBody,
} from "./dashboard";
import {
  blockUnmockedApiCalls,
  blockRealtimeSockets,
  mockRefreshSuccess,
  mockBoardPermissions,
} from "../orders/board";

/**
 * Dashboard detailed metrics (Parte 3): the lazily-loaded metrics grid —
 * payment methods and trend comparison — renders the detailed payload.
 */

test.describe("Dashboard — métricas detalladas", () => {
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

  test("métodos de pago y comparativa con datos", async ({ page }) => {
    await openDashboard(page);

    // The lazy section mounts on scroll (rootMargin may already cover it,
    // scrolling keeps this deterministic).
    await page
      .getByRole("heading", { name: "Métricas Detalladas" })
      .scrollIntoViewIfNeeded();

    await expect(
      page.getByText("Métodos de Pago", { exact: true }).first()
    ).toBeVisible();
    await expect(page.getByText("CASH", { exact: true })).toBeVisible();
    await expect(page.getByText("CARD", { exact: true })).toBeVisible();
    await expect(page.getByText("56%", { exact: true })).toBeVisible();
    await expect(page.getByText("44%", { exact: true })).toBeVisible();

    await expect(
      page.getByText("Comparativa", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("+25.0% vs período anterior")
    ).toBeVisible();
    await expect(page.getByText("Anterior: $ 1.000.000")).toBeVisible();
  });

  test("sin métodos de pago no hay filas pero la tarjeta existe", async ({
    page,
  }) => {
    const body = defaultMetricsBody();
    body.metodosPago = [];
    body.comparativa.recaudoTotal = {
      valor: 0,
      valorAnterior: 0,
      crecimiento: 0,
    };
    await mockDashboardMetrics(page, { body });
    await openDashboard(page);

    await page
      .getByRole("heading", { name: "Métricas Detalladas" })
      .scrollIntoViewIfNeeded();

    await expect(
      page.getByText("Métodos de Pago", { exact: true }).first()
    ).toBeVisible();
    await expect(page.getByText("CASH", { exact: true })).toHaveCount(0);
    await expect(
      page.getByText("Comparativa", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("0.0% vs período anterior")
    ).toBeVisible();
  });
});

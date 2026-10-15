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

  test("ingresos con comparativa y métodos de pago con datos", async ({
    page,
  }) => {
    await openDashboard(page);

    // The lazy section mounts on scroll (rootMargin may already cover it,
    // scrolling keeps this deterministic).
    const detail = page.getByRole("region", { name: "Métricas detalladas" });
    await detail.scrollIntoViewIfNeeded();

    await expect(
      detail.getByText("Métodos de Pago", { exact: true })
    ).toBeVisible();
    await expect(detail.getByText("CASH", { exact: true })).toBeVisible();
    await expect(detail.getByText("CARD", { exact: true })).toBeVisible();
    await expect(detail.getByText("56%", { exact: true })).toBeVisible();
    await expect(detail.getByText("44%", { exact: true })).toBeVisible();

    // Comparativa del período en el encabezado del gráfico de ingresos.
    await expect(
      detail.getByText("Ingresos últimos 30 días", { exact: true })
    ).toBeVisible();
    await expect(detail.getByText("Período actual")).toBeVisible();
    await expect(
      detail.getByText("$ 1.000.000", { exact: true })
    ).toBeVisible();
    await expect(detail.getByText("↑ 25.0%", { exact: true })).toBeVisible();
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

    const detail = page.getByRole("region", { name: "Métricas detalladas" });
    await detail.scrollIntoViewIfNeeded();

    await expect(
      detail.getByText("Métodos de Pago", { exact: true })
    ).toBeVisible();
    await expect(detail.getByText("CASH", { exact: true })).toHaveCount(0);
    await expect(detail.getByText("Período actual")).toBeVisible();
    await expect(detail.getByText("0.0%", { exact: true })).toBeVisible();
  });
});

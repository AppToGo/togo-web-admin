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
 * Dashboard charts (Parte 4): the lazily-loaded analysis section —
 * revenue, peak hours, conversion funnel and payment methods — mounts
 * with data and degrades to an empty state without it.
 *
 * NOTE: funnel counts/percentages only live inside recharts tooltips
 * (hover-only, unsuitable for deterministic asserts), so the funnel is
 * pinned by its title and stage labels.
 */

test.describe("Dashboard — gráficos", () => {
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

  test("la sección de análisis monta con datos", async ({ page }) => {
    await openDashboard(page);

    await page
      .getByRole("heading", { name: "Análisis" })
      .scrollIntoViewIfNeeded();

    await expect(
      page.getByText("Ingresos últimos 30 días", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Horas Pico", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Embudo de Conversión", { exact: true })
    ).toBeVisible();
    // Funnel stage labels render twice each: Y-axis tick + legend row.
    for (const stage of ["Nuevas", "Pagadas", "Completadas"]) {
      await expect(page.getByText(stage, { exact: true })).toHaveCount(2);
    }
  });

  test("sin métodos de pago el gráfico muestra su vacío", async ({
    page,
  }) => {
    const body = defaultMetricsBody();
    body.metodosPago = [];
    await mockDashboardMetrics(page, { body });
    await openDashboard(page);

    await page
      .getByRole("heading", { name: "Análisis" })
      .scrollIntoViewIfNeeded();

    await expect(
      page.getByText("No hay datos de métodos de pago disponibles")
    ).toBeVisible();
  });
});

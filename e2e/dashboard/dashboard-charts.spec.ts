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
      .getByRole("region", { name: "Análisis" })
      .scrollIntoViewIfNeeded();

    await expect(
      page.getByText("Ingresos por día", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Horas Pico", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Embudo de Conversión", { exact: true })
    ).toBeVisible();
    // Embudo acumulado: confirmadas = todo lo que salió de borrador
    // (340 − 5 DRAFT − 5 ABANDONED), pagadas = paymentStatus PAID (300),
    // completadas = COMPLETED (290). Ninguna etapa queda en 0 aunque no haya
    // pedidos parados en PAID.
    const stage = (name: string) =>
      page.getByRole("listitem").filter({ hasText: name });
    await expect(stage("Nuevas")).toContainText("330 · 100%");
    await expect(stage("Pagadas")).toContainText("300 · 91%");
    await expect(stage("Completadas")).toContainText("290 · 88%");

    // Una fila por etapa del embudo, con su barra de progreso.
    for (const stage of ["Nuevas", "Pagadas", "Completadas"]) {
      await expect(page.getByText(stage, { exact: true })).toHaveCount(1);
      await expect(
        page.getByRole("progressbar", { name: stage })
      ).toBeVisible();
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
      .getByRole("region", { name: "Métricas detalladas" })
      .scrollIntoViewIfNeeded();

    await expect(
      page.getByText("No hay datos de métodos de pago disponibles")
    ).toBeVisible();
  });
});

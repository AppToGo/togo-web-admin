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
 * Dashboard KPIs (Parte 2): the four cards render the transformed
 * GET /businesses/:businessId/orders/metrics payload, including trends
 * and the zero-data state.
 */

test.describe("Dashboard — KPIs", () => {
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

  test("las cuatro tarjetas muestran valores y tendencias", async ({
    page,
  }) => {
    // Distinct comparativa values so the KPI revenue ("$ 1.250.000") can't
    // be confused with the revenue chart's current period ("$ 2.000.000") —
    // both read the same endpoint but different fields.
    const body = defaultMetricsBody();
    body.comparativa.recaudoTotal = {
      valor: 2000000,
      valorAnterior: 1600000,
      crecimiento: 25,
    };
    await mockDashboardMetrics(page, { body });
    await openDashboard(page);
    const kpis = page.getByRole("region", { name: "Indicadores" });

    // Titles — exactly the four KPI cards.
    for (const title of [
      "Pedidos hoy",
      "Ingresos del período",
      "Pedidos del período",
      "Ticket promedio",
    ]) {
      await expect(kpis.getByText(title, { exact: true })).toBeVisible();
    }

    // Values from the default mock (12 hoy / 8 completadas,
    // 1.250.000 COP, 340 totales, ticket 1.250.000 / 300).
    // Bare numbers are scoped to paragraphs: chart SVG ticks (e.g. peak
    // hour "12") would otherwise match the same text.
    await expect(
      kpis.getByRole("paragraph").filter({ hasText: /^12$/ })
    ).toBeVisible();
    await expect(kpis.getByText("8 completados")).toBeVisible();
    await expect(kpis.getByText("1.250.000")).toBeVisible();
    await expect(
      kpis.getByRole("paragraph").filter({ hasText: /^340$/ })
    ).toBeVisible();
    await expect(
      kpis.getByText("300 pagados · 40 pendientes")
    ).toBeVisible();
    // COP has no minor unit so Intl renders zero decimals (4.167).
    await expect(kpis.getByText("4.167")).toBeVisible();

    // Positive growth renders up-trends with one decimal.
    await expect(kpis.getByText("↑ 25.0%")).toBeVisible();
    await expect(kpis.getByText("↑ 8.5%")).toBeVisible();
  });

  test("los títulos siguen el período del filtro", async ({ page }) => {
    await openDashboard(page);
    const kpis = page.getByRole("region", { name: "Indicadores" });

    // Con "Hoy" la tarjeta de ingresos lo dice en la descripción.
    await expect(kpis.getByText("Hoy", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: /Hoy/ }).first().click();
    await page.getByRole("button", { name: "Este mes" }).click();

    await expect(kpis.getByText("Este mes", { exact: true })).toBeVisible();
    await expect(
      kpis.getByText("Ingresos del período", { exact: true })
    ).toBeVisible();
    // "Pedidos hoy" sigue siendo de hoy: la API lo calcula sin el filtro.
    await expect(kpis.getByText("Pedidos hoy", { exact: true })).toBeVisible();
  });

  test("crecimiento negativo muestra tendencia a la baja", async ({
    page,
  }) => {
    const body = defaultMetricsBody();
    body.comparativa.recaudoTotal.crecimiento = -12.4;
    body.comparativa.ordenesTotales.crecimiento = -3.2;
    await mockDashboardMetrics(page, { body });
    await openDashboard(page);
    const kpis = page.getByRole("region", { name: "Indicadores" });

    await expect(kpis.getByText("↓ 12.4%")).toBeVisible();
    await expect(kpis.getByText("↓ 3.2%")).toBeVisible();
  });

  test("sin datos muestra ceros y sin tendencias", async ({ page }) => {
    const body = defaultMetricsBody();
    body.conteos = { hoy: 0, completadasHoy: 0, total: 0, pagadas: 0, pendientesPago: 0 };
    body.recaudos.pagadas.total = 0;
    body.comparativa.recaudoTotal.crecimiento = 0;
    body.comparativa.ordenesTotales.crecimiento = 0;
    await mockDashboardMetrics(page, { body });
    await openDashboard(page);
    const kpis = page.getByRole("region", { name: "Indicadores" });

    await expect(kpis.getByText("0 completados")).toBeVisible();
    await expect(
      kpis.getByText("0 pagados · 0 pendientes")
    ).toBeVisible();
    // Neutral growth renders no trend line at all.
    await expect(kpis.getByText("↑")).toHaveCount(0);
    await expect(kpis.getByText("↓")).toHaveCount(0);
  });
});

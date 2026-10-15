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
import { mockConversationFunnel } from "../helpers/mock-conversation-funnel-api";

/**
 * Dashboard charts (Parte 4): the lazily-loaded sections — revenue, payment
 * methods, order status, bot conversations and peak hours — mount with data
 * and degrade to an empty state without it.
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

    const analysis = page.getByRole("region", { name: "Análisis" });
    await analysis.scrollIntoViewIfNeeded();

    await expect(
      page.getByText("Ingresos por día", { exact: true })
    ).toBeVisible();
    await expect(
      analysis.getByText("Horas Pico", { exact: true })
    ).toBeVisible();

    // Estado de los pedidos: los 340 del mock según su estado actual
    // (COMPLETED 290; en curso = CONFIRMED 10 + IN_PROGRESS 15; CANCELLED 15;
    // sin confirmar = DRAFT 5 + ABANDONED 5). Porcentajes por mayor residuo
    // para que sumen 100: 85,29 · 7,35 · 4,41 · 2,94 → 85 · 7 · 5 · 3.
    const status = (name: string) =>
      analysis.getByRole("listitem").filter({ hasText: name });
    await expect(
      analysis.getByText("Estado de los pedidos", { exact: true })
    ).toBeVisible();
    await expect(status("Completados")).toContainText("290 · 85%");
    await expect(status("En curso")).toContainText("25 · 7%");
    await expect(status("Cancelados")).toContainText("15 · 5%");
    await expect(status("Sin confirmar")).toContainText("10 · 3%");
    await expect(
      analysis.getByText("Por cobrar: 40 pedidos · $ 480.000")
    ).toBeVisible();

    // Sin metrics.view no se pide ni se muestra el embudo del bot.
    await expect(
      analysis.getByText("Conversaciones del bot", { exact: true })
    ).toHaveCount(0);
  });

  test("con metrics.view muestra el resumen del bot", async ({ page }) => {
    await mockConversationFunnel(page, {
      permissions: ["order.view", "metrics.view"],
    });
    await openDashboard(page);

    const analysis = page.getByRole("region", { name: "Análisis" });
    await analysis.scrollIntoViewIfNeeded();

    const bot = (name: string) =>
      analysis.getByRole("listitem").filter({ hasText: name });
    await expect(
      analysis.getByText("Conversaciones del bot", { exact: true })
    ).toBeVisible();
    // 7 conversaciones: 2 con pedido, 1 abierta, 2 abandonadas, 2 otras.
    // 28,57% × 3 y 14,29%: para sumar 100 solo dos de los tres empates suben
    // a 29 (los primeros en el orden de la leyenda).
    await expect(bot("Terminan en pedido")).toContainText("2 · 29%");
    await expect(bot("Abandonadas")).toContainText("2 · 29%");
    await expect(bot("Otras")).toContainText("2 · 28%");
    await expect(analysis.getByText(/^Piden un asesor:/)).toBeVisible();
    await expect(
      analysis.getByRole("link", { name: "Ver embudo del bot" })
    ).toHaveAttribute("href", /\/dashboard\/conversation-funnel\/?$/);
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

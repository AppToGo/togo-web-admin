import { test, expect, type Page } from "playwright/test";
import { mockLoginSuccess } from "../helpers/mock-api";
import { mockOrdersDashboard } from "../helpers/mock-orders-api";
import {
  openBoard,
  mockBoardPermissions,
  blockUnmockedApiCalls,
  blockRealtimeSockets,
  mockRefreshSuccess,
  boardOrderNumber,
} from "./board";

/**
 * Orders board statistics (Parte 2).
 *
 * NOTE: DeliveryMetricsCard and RecentActivity are NOT on this page — they
 * render on the dashboard home (`/dashboard`). This spec covers what the
 * orders board actually mounts: OrderMetrics + StatsTickerRail.
 *
 *   - Payment counts mirror the /orders/metrics response (data-driven)
 *   - Ticker shows the live summary
 *   - A metrics failure does not break the Kanban
 */

const BASE_METRICS = {
  businessId: "e2e-test-business-id",
  generadoEn: new Date().toISOString(),
  periodo: {},
  porEstadoOrden: {},
  porTipoEntrega: {
    DELIVERY: { total: 0, pagadas: 0, pendientesPago: 0 },
    PICKUP: { total: 0, pagadas: 0, pendientesPago: 0 },
    DINE_IN: { total: 0, pagadas: 0, pendientesPago: 0 },
  },
  recaudos: {
    pagadas: { subtotal: 0, delivery: 0, total: 0 },
    pendientesPago: { subtotal: 0, delivery: 0, total: 0 },
    delivery: {
      pagadas: { subtotal: 0, delivery: 0, total: 0 },
      pendientesPago: { subtotal: 0, delivery: 0, total: 0 },
    },
    pickup: {
      pagadas: { subtotal: 0, delivery: 0, total: 0 },
      pendientesPago: { subtotal: 0, delivery: 0, total: 0 },
    },
    dineIn: {
      pagadas: { subtotal: 0, delivery: 0, total: 0 },
      pendientesPago: { subtotal: 0, delivery: 0, total: 0 },
    },
  },
  promedios: { valorOrden: 0, valorOrdenPagada: 0, valorOrdenDelivery: 0, valorOrdenPickup: 0 },
  comparativa: {
    recaudoTotal: { valor: 0, valorAnterior: 0, crecimiento: 0 },
    ordenesTotales: { valor: 0, valorAnterior: 0, crecimiento: 0 },
  },
  metodosPago: [],
  horasPico: [],
  tasasConversion: { confirmacion: 0, pago: 0, completitud: 0, cancelacion: 0, abandono: 0 },
};

/** Serve a custom /orders/metrics payload AFTER mockOrdersDashboard. */
async function mockMetrics(
  page: Page,
  conteos: Record<string, number>
): Promise<void> {
  await page.route("**/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/orders/metrics")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...BASE_METRICS, conteos }),
      });
    }
    await route.fallback();
  });
}

test.describe("Orders — estadísticas", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await blockUnmockedApiCalls(page);
    await blockRealtimeSockets(page);
    await mockLoginSuccess(page);
    await mockOrdersDashboard(page);
    await mockBoardPermissions(page);
    await mockRefreshSuccess(page);
  });

  test("los conteos de pago reflejan la API", async ({ page }) => {
    await mockMetrics(page, {
      total: 5,
      pagadas: 4,
      pendientesPago: 1,
      hoy: 5,
      completadasHoy: 0,
    });
    await openBoard(page);

    await expect(page.getByText("Pagado")).toBeVisible();
    await expect(page.getByText("4 órdenes")).toBeVisible();
    await expect(page.getByText("Pendiente de pago")).toBeVisible();
    // ICU singular for exactly one
    await expect(page.getByText("1 orden", { exact: true })).toBeVisible();

    // Values not present in the mock must not appear
    await expect(page.getByText("9 órdenes")).toHaveCount(0);
  });

  test("el ticker muestra el resumen en curso", async ({ page }) => {
    await openBoard(page);

    await expect(page.getByText("En curso")).toBeVisible();
  });

  test("un fallo de métricas no rompe el tablero", async ({ page }) => {
    await page.route("**/v1/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith("/orders/metrics")) {
        return route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ message: "metrics down" }),
        });
      }
      await route.fallback();
    });
    await openBoard(page);

    // The Kanban keeps working; no full-board error takes over
    await expect(boardOrderNumber(page, "#101")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Error al cargar órdenes" })
    ).toHaveCount(0);
  });
});

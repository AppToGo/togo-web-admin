import { test, expect } from "playwright/test";
import { mockLoginSuccess } from "../helpers/mock-api";
import { mockOrdersDashboard } from "../helpers/mock-orders-api";
import {
  openBoard,
  mockBoardPermissions,
  blockUnmockedApiCalls,
  blockRealtimeSockets,
  mockRefreshSuccess,
} from "./board";

/**
 * Regresión: "Hoy" se calculaba una sola vez al cargar. Con la pestaña
 * abierta de un día a otro el tablero seguía pidiendo los pedidos de ayer,
 * así que un pedido nuevo sonaba pero no aparecía hasta refrescar. Ahora el
 * rango se recalcula al cambiar el día (cada minuto y al volver a la pestaña).
 */
test.describe("Orders — cambio de día con la pestaña abierta", () => {
  test("al pasar la medianoche el tablero pide los pedidos del día nuevo", async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    // Reloj del navegador a las 23:58 (hora local); el tiempo sigue corriendo.
    await page.clock.install({ time: new Date(2026, 9, 7, 23, 58, 0) });

    await blockUnmockedApiCalls(page);
    await blockRealtimeSockets(page);
    await mockLoginSuccess(page);
    await mockOrdersDashboard(page);
    await mockBoardPermissions(page);
    await mockRefreshSuccess(page);

    const requestedDays: string[] = [];
    await page.route("**/v1/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith("/orders") && !url.searchParams.get("status")) {
        const dateFrom = url.searchParams.get("dateFrom");
        if (dateFrom) requestedDays.push(dateFrom);
        return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
      }
      await route.fallback();
    });

    await openBoard(page);
    expect(requestedDays).toContain("2026-10-07");

    // Pasa la medianoche con la pestaña abierta: el chequeo de cada minuto
    // corre el rango a "hoy" y el tablero vuelve a pedir pedidos.
    await page.clock.fastForward("03:00");
    await expect.poll(() => requestedDays.at(-1), { timeout: 10_000 }).toBe("2026-10-08");
  });
});

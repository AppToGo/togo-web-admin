import { test, expect, type Page } from "playwright/test";
import { mockLoginSuccess } from "../helpers/mock-api";
import { mockOrdersDashboard } from "../helpers/mock-orders-api";
import { mockConversationsApi } from "../helpers/mock-conversations-api";
import { mockBranches } from "../dashboard/dashboard";
import {
  blockUnmockedApiCalls,
  blockRealtimeSockets,
  mockRefreshSuccess,
  mockBoardPermissions,
  openBoard,
} from "../orders/board";

/**
 * Sidebar de escritorio: orden del menú principal y badge de Pedidos, que
 * cuenta los pendientes de abrir sin importar el período del tablero.
 */

test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });

const OPERATOR = [
  "order.view",
  "order.create",
  "customer.view",
  "cash.view",
  "conversation.view",
  "metrics.view",
];

const UNSEEN = 3;

async function login(page: Page, unseenUrls: URL[]): Promise<void> {
  await page.context().clearCookies();
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Período personalizado viejo en Pedidos: no incluye hoy.
    localStorage.setItem(
      "togo-date-filter",
      JSON.stringify({
        state: { preset: "custom", range: { from: "2026-01-01", to: "2026-01-02" } },
        version: 0,
      })
    );
  });
  await blockUnmockedApiCalls(page);
  await blockRealtimeSockets(page);
  await mockLoginSuccess(page);
  await mockOrdersDashboard(page);
  await mockBranches(page);
  await mockRefreshSuccess(page);
  await mockConversationsApi(page);
  await page.route("**/v1/**", (route) => {
    const url = new URL(route.request().url());
    if (!url.pathname.endsWith("/orders/unseen-count")) return route.fallback();
    unseenUrls.push(url);
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ count: UNSEEN }),
    });
  });
  await mockBoardPermissions(page, OPERATOR);
  await openBoard(page);
}

test.describe("Sidebar", () => {
  test("el badge de Pedidos no depende del período elegido", async ({ page }) => {
    test.setTimeout(60_000);
    const unseenUrls: URL[] = [];
    await login(page, unseenUrls);

    const nav = page.getByRole("navigation").first();
    await expect(nav.getByRole("link", { name: /Pedidos/ })).toContainText(String(UNSEEN));
    expect(unseenUrls.length).toBeGreaterThan(0);
    for (const url of unseenUrls) {
      expect(url.searchParams.get("dateFrom")).toBeNull();
      expect(url.searchParams.get("dateTo")).toBeNull();
    }
  });

  test("el menú arranca en Dashboard y sigue con Pedidos, Caja y Conversaciones", async ({ page }) => {
    test.setTimeout(60_000);
    await login(page, []);

    const nav = page.getByRole("navigation").first();
    const labels = (await nav.locator("a, button").allInnerTexts())
      .map((text) => text.replace(/\d+\+?/g, "").trim())
      .filter(Boolean);
    const order = ["Dashboard", "Pedidos", "Caja", "Conversaciones", "Clientes", "Catálogo", "Configuración"];
    const positions = order.map((label) => labels.findIndex((l) => l.startsWith(label)));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });
});

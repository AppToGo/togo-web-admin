import { expect, type Locator, type Page } from "playwright/test";
import { LoginPage } from "../pages/LoginPage";

/**
 * Final safety net for board specs: abort any backend call that no mock
 * handles.
 *
 * Register this FIRST in `beforeEach` (first-registered runs last), so it
 * only catches what fell through every other handler. Without it, unmocked
 * calls reach the real backend, which answers 401 to the fake e2e token —
 * and the Axios interceptor treats that as an expired session and bounces
 * the app back to /login mid-test.
 */
export async function blockUnmockedApiCalls(page: Page): Promise<void> {
  await page.route("**/v1/**", (route) => route.abort("failed"));
}

/**
 * Block the realtime socket transport for board specs.
 *
 * `useOrdersRealtime` dials the REAL backend (socket.io is outside the
 * `/v1/**` mocks). With the backend up, the fake e2e token triggers
 * auth_error → refresh → reconnect cycles that invalidate queries in a
 * loop and eventually bounce the session. Aborting both transports keeps
 * the board on pure HTTP mocks: the hook retries with backoff, never
 * connects, and never logs out.
 */
export async function blockRealtimeSockets(page: Page): Promise<void> {
  await page.route("**/socket.io/**", (route) => route.abort("failed"));
  await page.routeWebSocket("**/socket.io/**", (ws) => ws.close());
}

/**
 * Mock the Next.js session-refresh endpoint for board specs.
 *
 * The board mounts `useOrdersRealtime`, whose socket connects with the fake
 * e2e token. The backend rejects it, the hook refreshes via the REAL
 * `/api/auth/refresh` route, and with the fake cookie that route answers
 * 401 — logging the user out mid-test. A healthy mocked refresh keeps the
 * session alive; after 3 failed socket auth attempts the hook gives up
 * quietly (`reconnect_failed`, no logout).
 */
export async function mockRefreshSuccess(page: Page): Promise<void> {
  await page.route("**/api/auth/refresh", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "e2e-fake-access-token",
        refresh_token: "e2e-fake-refresh-token",
        expires_in: 3600,
        user: {
          userId: "e2e-test-user-id",
          email: "test@togo.com",
          name: "Test User",
          role: "ADMIN",
          businessId: "e2e-test-business-id",
          businessName: "Test Business",
          operatorProfileId: null,
          subscriptionPlan: 1,
        },
      }),
    })
  );
}

/**
 * Mock the operator permissions for board specs.
 * The "Nuevo pedido" button (and other actions) hide behind `<Can>`
 * gates — without this, the board renders but the actions never appear.
 * Register AFTER `mockOrdersDashboard` (last matching route wins).
 */
export async function mockBoardPermissions(
  page: Page,
  permissions: string[] = ["order.view", "order.create"]
): Promise<void> {
  await page.route("**/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/auth/me/permissions")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(permissions),
      });
    }
    await route.fallback();
  });
}

/**
 * Shared setup for orders-board specs.
 *
 * Logs in with the mocked backend and lands on a hydrated Kanban,
 * discarding the overlays that would otherwise intercept clicks:
 * onboarding tour, welcome toast and the plan-upsell modal.
 *
 * Requires `mockLoginSuccess(page)` + `mockOrdersDashboard(page)` (plus any
 * scenario routes) to be registered BEFORE calling — typically in
 * `beforeEach`, since Playwright runs the LAST-registered matching route
 * first.
 */
export async function openBoard(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.fillCredentials("test@togo.com", "any-password");
  await loginPage.submit();
  await loginPage.waitForDashboardRedirect();

  // Sync point: the Kanban finished hydrating (the tour mounts on top of it).
  await expect(page.getByRole("button", { name: "Nuevo pedido" })).toBeVisible();

  // Full-screen onboarding spotlight — dismiss when present.
  await page
    .getByRole("button", { name: /saltar tour/i })
    .click({ timeout: 5_000 })
    .catch(() => undefined);
  // Welcome toast floats over the toolbar and steals clicks.
  await page
    .getByText("¡Bienvenido! Inicio de sesión exitoso")
    .waitFor({ state: "hidden", timeout: 15_000 })
    .catch(() => undefined);
  // Plan upsell modal (unmocked /plans falls into its error state).
  await page
    .getByText("Continuar con plan gratuito")
    .click({ timeout: 5_000 })
    .catch(() => undefined);
}

/**
 * Número de pedido en el tablero (tarjeta o fila), sin contar el panel
 * "Por cobrar": ese panel repite el número de los pedidos en efectivo con
 * pago pendiente y no lo afectan la búsqueda ni los filtros del tablero.
 */
export function boardOrderNumber(page: Page, orderNumber: string): Locator {
  return page
    .getByText(orderNumber, { exact: true })
    .and(page.locator(':not([data-testid="to-collect-panel"] *)'));
}

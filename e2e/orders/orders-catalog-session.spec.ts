import { test, expect, type Page } from "playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { mockLoginSuccess } from "../helpers/mock-api";
import { mockOrdersDashboard } from "../helpers/mock-orders-api";
import {
  blockUnmockedApiCalls,
  blockRealtimeSockets,
  mockRefreshSuccess,
} from "./board";

/**
 * "Tomar pedido en catálogo": el cajero abre el catálogo web en modo
 * operador a nombre de un mesero y hasta una hora del turno de la sede, que
 * puede cerrar pasada la medianoche.
 */

const TZ = "America/Bogota";

/** Mañana a las 02:00 en Bogotá (UTC-5): el cierre de un turno nocturno. */
function tomorrowAtTwoInBogota(): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
  const closes = new Date(`${today}T02:00:00-05:00`);
  closes.setUTCDate(closes.getUTCDate() + 1);
  return closes.toISOString();
}

const OPERATORS = [
  { id: "user-laura", name: "Laura Mesera" },
  { id: "e2e-test-user-id", name: "Test User" },
];

interface MockOptions {
  window: { opensAt: string | null; closesAt: string; timezone: string; scheduleConfigured: boolean } | null;
}

async function mockCatalogSessionApi(
  page: Page,
  options: MockOptions,
  onCreate: (body: Record<string, unknown>) => void
) {
  await page.route("**/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

    if (path.endsWith("/auth/me/permissions")) return json(["order.view", "order.create"]);
    if (path.endsWith("/operator-catalog-sessions/options")) {
      return json({ operators: OPERATORS, window: options.window });
    }
    if (path.endsWith("/operator-catalog-sessions/mine")) return json([]);
    if (path.endsWith("/operator-catalog-sessions") && request.method() === "POST") {
      const body = request.postDataJSON() as Record<string, unknown>;
      onCreate(body);
      return json(
        {
          id: "ses-1",
          url: "https://catalogo.apptogo.co/la-parrilla?op=token",
          expiresAt: body.expiresAt,
          operatorName: "Laura Mesera",
        },
        201
      );
    }
    await route.fallback();
  });
}

async function openCatalogSessionDialog(page: Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.fillCredentials("test@togo.com", "any-password");
  await loginPage.submit();
  await loginPage.waitForDashboardRedirect();
  await expect(page.getByRole("button", { name: "Nuevo pedido" })).toBeVisible();

  // Mismos overlays que descarta orders-new-order.spec.ts.
  await page
    .getByRole("button", { name: /saltar tour/i })
    .click({ timeout: 5_000 })
    .catch(() => undefined);
  await page
    .getByText("¡Bienvenido! Inicio de sesión exitoso")
    .waitFor({ state: "hidden", timeout: 15_000 })
    .catch(() => undefined);
  await page
    .getByText("Continuar con plan gratuito")
    .click({ timeout: 5_000 })
    .catch(() => undefined);

  await page.getByRole("button", { name: "Tomar pedido en el catálogo web" }).first().click();
  // El Dialog del proyecto no expone role="dialog": se ubica por su panel.
  const dialog = page
    .locator("div.glass-strong")
    .filter({ has: page.getByText("Tomar pedido en catálogo", { exact: true }) });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe("Orders — tomar pedido en el catálogo web", () => {
  let created: Record<string, unknown>[];

  async function setup(page: Page, options: MockOptions) {
    created = [];
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await blockUnmockedApiCalls(page);
    await blockRealtimeSockets(page);
    await mockLoginSuccess(page);
    await mockOrdersDashboard(page);
    await mockRefreshSuccess(page);
    await mockCatalogSessionApi(page, options, (body) => created.push(body));
  }

  test("abre la sesión a nombre del mesero hasta el cierre del día siguiente", async ({ page }) => {
    const closesAt = tomorrowAtTwoInBogota();
    await setup(page, {
      window: { opensAt: null, closesAt, timezone: TZ, scheduleConfigured: true },
    });
    const dialog = await openCatalogSessionDialog(page);

    // Por defecto, quien abre el diálogo y el cierre del turno.
    const operator = dialog.getByRole("combobox", { name: "Operador" });
    const expires = dialog.getByRole("combobox", { name: "Disponible hasta" });
    await expect(operator).toHaveText("Test User");
    await expect(expires).toHaveText("02:00 (mañana) · cierre");

    // El contenido no queda pegado a los bordes del modal.
    const dialogBox = (await dialog.boundingBox())!;
    const operatorBox = (await operator.boundingBox())!;
    expect(operatorBox.x - dialogBox.x).toBeGreaterThanOrEqual(20);
    expect(dialogBox.x + dialogBox.width - (operatorBox.x + operatorBox.width)).toBeGreaterThanOrEqual(20);

    await operator.click();
    await page.getByRole("option", { name: "Laura Mesera" }).click();
    await dialog.getByRole("button", { name: "Abrir catálogo en modo operador" }).click();

    await expect(dialog.getByText(/Sesión de Laura Mesera/)).toBeVisible();
    expect(created).toEqual([
      { branchId: "e2e-test-branch-id", userId: "user-laura", expiresAt: closesAt },
    ]);
  });

  test("sin turno abierto ni próximo no deja abrir la sesión", async ({ page }) => {
    await setup(page, { window: null });
    const dialog = await openCatalogSessionDialog(page);

    await expect(dialog.getByText(/no tiene un turno abierto ni próximo/)).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Abrir catálogo en modo operador" })
    ).toBeDisabled();
  });
});

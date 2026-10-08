import { test, expect, type Page } from "playwright/test";
import { mockLoginSuccess } from "../helpers/mock-api";
import { mockCashDashboard } from "./mock-cash-api";
import { LoginPage } from "../pages/LoginPage";
import {
  blockUnmockedApiCalls,
  blockRealtimeSockets,
  mockRefreshSuccess,
  mockBoardPermissions,
} from "../orders/board";

/**
 * Página de Caja (docs/caja-pedidos.md) con red mockeada.
 *
 * Los sockets se bloquean como en los specs del tablero: sin backend
 * real, el handshake de socket.io entraría en ciclos de reconexión que
 * tumban la sesión mockeada.
 */

async function loginAndOpenCash(
  page: Page,
  permissions: string[],
  options?: { openSession?: boolean }
): Promise<void> {
  await page.context().clearCookies();
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await blockUnmockedApiCalls(page);
  await blockRealtimeSockets(page);
  await mockLoginSuccess(page);
  await mockCashDashboard(page, options);
  await mockBoardPermissions(page, permissions);
  await mockRefreshSuccess(page);

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.fillCredentials("test@togo.com", "any-password");
  await loginPage.submit();
  await loginPage.waitForDashboardRedirect();
  await page.goto("/es/dashboard/cash");
}

test.describe("Caja — gateo y turno", () => {
  test("sin cash.view la ruta muestra aviso y el sidebar no trae Caja", async ({
    page,
  }) => {
    await loginAndOpenCash(page, ["order.view"]);

    await expect(page.getByText("No tienes permiso para ver la caja")).toBeVisible();
    await expect(page.getByRole("link", { name: "Caja" })).toHaveCount(0);
  });

  test("con cash.view muestra el turno abierto y lo por liquidar", async ({
    page,
  }) => {
    await loginAndOpenCash(page, ["cash.view", "cash.operate"]);

    await expect(page.getByRole("heading", { name: "Caja" })).toBeVisible();
    await expect(page.getByText("Caja 1").first()).toBeVisible();
    // Esperado del turno (formato COP es-CO)
    await expect(page.getByText("$ 50.000").first()).toBeVisible();
    // Recaudo pendiente con su portador
    await expect(page.getByText("Repartidor E2E")).toBeVisible();
  });

  test("sin turno abierto ofrece abrirlo con base inicial", async ({ page }) => {
    await loginAndOpenCash(page, ["cash.view", "cash.operate"], {
      openSession: false,
    });

    await page.getByRole("button", { name: "Abrir turno" }).click();
    await expect(page.getByText("Base inicial (COP)")).toBeVisible();
  });

  test("el sidebar lleva a Caja cuando hay permiso", async ({ page }) => {
    await loginAndOpenCash(page, ["cash.view"]);

    await page.getByRole("link", { name: "Caja" }).click();
    await expect(page).toHaveURL(/\/dashboard\/cash/);
  });
});

test.describe("Caja — historial, cierre y retiro", () => {
  test("el historial solo lista turnos cerrados", async ({ page }) => {
    await loginAndOpenCash(page, ["cash.view"]);

    await expect(page.getByText("Historial de turnos")).toBeVisible();
    await expect(page.getByText("Exacto")).toBeVisible();
    // El turno abierto de otra caja no es un cierre.
    await expect(page.getByText("Caja 2 en curso")).toHaveCount(0);
  });

  test("abrir turno muestra el último cierre de esa caja", async ({ page }) => {
    await loginAndOpenCash(page, ["cash.view", "cash.operate"], {
      openSession: false,
    });

    const lastCloseRequest = page.waitForRequest(
      (request) =>
        request.url().includes("/cash/sessions?") &&
        request.url().includes("cashRegisterId=reg-1") &&
        request.url().includes("status=CLOSED")
    );
    await page.getByRole("button", { name: "Abrir turno" }).click();
    await lastCloseRequest;
    await expect(page.getByText("Último cierre: $ 40.000")).toBeVisible();
  });

  test("lo por liquidar de la sede avisa pero no bloquea el cierre", async ({
    page,
  }) => {
    await loginAndOpenCash(page, ["cash.view", "cash.close"]);

    await page.getByRole("button", { name: "Cerrar turno" }).click();
    await expect(page.getByText(/Puedes cerrar el turno/)).toBeVisible();
    // Contado = esperado ($ 50.000): sin diferencia no pide motivo.
    await page.getByRole("button", { name: "+1 × 50000" }).click();
    await expect(
      page.getByRole("button", { name: "Cerrar turno" }).last()
    ).toBeEnabled();
  });

  test("el retiro lista autorizadores sin pedir los usuarios del negocio", async ({
    page,
  }) => {
    const userListRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname.endsWith("/users")) {
        userListRequests.push(request.url());
      }
    });
    await loginAndOpenCash(page, ["cash.view", "cash.withdraw"]);

    await page.getByRole("button", { name: "Movimientos" }).click();
    await page.locator("#cash-movement-auth").click();
    await expect(page.getByRole("option", { name: "Dueña E2E" })).toBeVisible();
    expect(userListRequests).toEqual([]);
  });
});

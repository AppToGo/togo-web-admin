import { test, expect, type Page } from "playwright/test";
import { mockLoginSuccess } from "../helpers/mock-api";
import { mockOrdersDashboard } from "../helpers/mock-orders-api";
import { mockCashDashboard } from "../cash/mock-cash-api";
import {
  mockDashboardMetrics,
  mockBranches,
  openDashboard,
} from "../dashboard/dashboard";
import {
  blockUnmockedApiCalls,
  blockRealtimeSockets,
  mockRefreshSuccess,
  mockBoardPermissions,
  openBoard,
} from "../orders/board";

/**
 * Admin en el teléfono (diseño "Caja POS móvil"): barra superior con menú
 * y nombre de la sección, Pedidos por estado y Caja con pestañas abajo.
 */

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const CASHIER = [
  "cash.view",
  "cash.operate",
  "cash.close",
  "order.create",
  "order.view",
  "order.change_payment_status",
];

async function base(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await blockUnmockedApiCalls(page);
  await blockRealtimeSockets(page);
  await mockLoginSuccess(page);
}

test.describe("Admin en el teléfono", () => {
  test("barra superior: nombre de la sección y menú lateral", async ({ page }) => {
    await base(page);
    await mockBranches(page);
    await mockDashboardMetrics(page);
    // El test navega a Pedidos: sin sus métricas, el riel de estadísticas
    // recibía las del dashboard (otra forma) y fallaba de forma intermitente.
    await mockOrdersDashboard(page);
    await mockRefreshSuccess(page);
    await mockBoardPermissions(page);
    await openDashboard(page);

    await expect(page.getByTestId("mobile-section-title")).toHaveText("Dashboard");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.getByRole("link", { name: "Pedidos" }).click();
    await expect(page).toHaveURL(/\/dashboard\/orders/);
    await expect(page.getByTestId("mobile-section-title")).toHaveText("Pedidos");
  });

  test("pedidos: un estado a la vez y Nuevo pedido flotante", async ({ page }) => {
    await base(page);
    await mockOrdersDashboard(page);
    await mockRefreshSuccess(page);
    await mockBoardPermissions(page, ["order.view", "order.create"]);
    // Aunque el usuario haya elegido el tablero en escritorio.
    await page.addInitScript(() => {
      localStorage.setItem("togo-orders-board-view", "board");
    });
    await openBoard(page);

    // Vista por estado: pestañas y una sola lista, sin el riel de métricas.
    await expect(page.getByRole("button", { name: /Nueva/ }).first()).toBeVisible();
    await expect(page.getByText("Operación en curso")).toHaveCount(0);
    await page.getByRole("button", { name: "Nuevo pedido" }).last().click();
    await expect(
      page.getByRole("dialog").getByRole("heading", { name: "Nuevo pedido" })
    ).toBeVisible();
  });

  test("caja: pestañas abajo, la venta a pantalla completa y Más", async ({ page }) => {
    await base(page);
    await mockCashDashboard(page);
    await mockBoardPermissions(page, CASHIER);
    await mockRefreshSuccess(page);
    await openBoard(page).catch(() => undefined);
    await page.goto("/es/dashboard/cash");

    const nav = page.getByTestId("cash-bottom-nav");
    await expect(nav).toBeVisible();
    // Las pestañas y las acciones del encabezado no se muestran arriba.
    await expect(page.getByRole("tab", { name: "Vender" })).toBeHidden();
    await expect(page.getByTestId("pos-kpi-chip")).toBeVisible();

    await page.getByRole("button", { name: "Agregar Hamburguesa clásica" }).first().click();
    await page.getByTestId("pos-view-sale").click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByRole("complementary", { name: "Venta actual" })).toBeVisible();
    await sheet.getByRole("button", { name: /^Cobrar\s*\$/ }).click();
    // El cobro reemplaza a la venta.
    await expect(page.getByRole("dialog").getByText("Cobrar venta")).toBeVisible();
    await page.keyboard.press("Escape");

    await nav.getByRole("button", { name: /Más/ }).dispatchEvent("click");
    await expect(page.getByRole("tab", { name: "Turno" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(page.getByRole("button", { name: "Cerrar caja" })).toBeVisible();
  });
});

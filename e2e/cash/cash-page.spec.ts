import { test, expect, type Page } from "playwright/test";
import { mockLoginSuccess } from "../helpers/mock-api";
import { mockCashDashboard, type CashMockOptions } from "./mock-cash-api";
import { LoginPage } from "../pages/LoginPage";
import {
  blockUnmockedApiCalls,
  blockRealtimeSockets,
  mockRefreshSuccess,
  mockBoardPermissions,
} from "../orders/board";

/**
 * Página de Caja (docs/caja-pedidos.md, docs/caja-pos.md) con red mockeada.
 *
 * Los sockets se bloquean como en los specs del tablero: sin backend
 * real, el handshake de socket.io entraría en ciclos de reconexión que
 * tumban la sesión mockeada.
 */

async function loginAndOpenCash(
  page: Page,
  permissions: string[],
  options?: CashMockOptions
): Promise<void> {
  await page.context().clearCookies();
  // Solo al abrir la pestaña: una recarga conserva las preferencias del
  // cajero (vista de productos, último tipo de pedido).
  await page.addInitScript(() => {
    if (window.name === "e2e-cash") return;
    window.name = "e2e-cash";
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

    // Con turno abierto el título es la caja (con su estado debajo).
    await expect(page.getByRole("heading", { name: "Caja 1" })).toBeVisible();
    await expect(page.getByTestId("pos-session-status")).toContainText(
      "Cajera E2E"
    );
    // Sin `order.create` no se vende: Caja abre en Turno y no hay Vender.
    await expect(page.getByRole("button", { name: "Turno" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    await expect(page.getByRole("button", { name: "Vender" })).toHaveCount(0);
    await expect(page.getByText("Caja 1").first()).toBeVisible();
    // Esperado del turno (formato COP es-CO)
    await expect(page.getByText("$ 50.000").first()).toBeVisible();
    // Recaudo pendiente con su portador, en la pestaña "Por liquidar"
    await page.getByRole("button", { name: /Por liquidar/ }).click();
    await expect(page.getByText("Repartidor E2E")).toBeVisible();
  });

  test("por cobrar agrupa por mesa e incluye pedidos ya entregados", async ({
    page,
  }) => {
    await loginAndOpenCash(page, [
      "cash.view",
      "cash.operate",
      "order.view",
      "order.change_payment_status",
    ]);

    const tab = page.getByRole("button", { name: /Por cobrar/ });
    await expect(tab).toContainText("2");
    await tab.click();
    const panel = page.getByTestId("to-collect-panel");
    await expect(panel.getByRole("heading", { name: "Mesa 2" })).toBeVisible();
    // La cuenta de la mesa con sus productos, aunque ya esté entregada.
    await expect(panel.getByText(/Entregada/)).toBeVisible();
    await expect(panel.getByText("Pasta boloñesa")).toBeVisible();
    await expect(panel.getByText(/Julián Mora/)).toBeVisible();

    // Cobrar desde Caja: el dinero entra a esta caja, sin "queda por liquidar".
    await panel.getByRole("button", { name: /^Cobrar #1056/ }).click();
    await expect(page.getByText("Confirmar pago")).toBeVisible();
    await expect(page.getByText("Entra a Caja 1")).toBeVisible();
    await expect(page.getByText("Queda por liquidar")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Confirmar y entrar a caja" })
    ).toBeEnabled();
  });

  test("sin order.view no se pide ni se muestra por cobrar", async ({ page }) => {
    const receivableRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/cash/receivables")) {
        receivableRequests.push(request.url());
      }
    });
    await loginAndOpenCash(page, ["cash.view", "cash.operate"]);

    await expect(page.getByRole("button", { name: /Por liquidar/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Por cobrar/ })).toHaveCount(0);
    expect(receivableRequests).toEqual([]);
  });

  test("sin turno abierto ofrece abrirlo con base inicial", async ({ page }) => {
    await loginAndOpenCash(page, ["cash.view", "cash.operate"], {
      openSession: false,
    });

    // Sin turno abierto el título sigue siendo la caja, con su estado.
    await expect(page.getByRole("heading", { name: "Caja 1" })).toBeVisible();
    await expect(page.getByTestId("pos-session-status")).toHaveText(
      "Sin turno abierto"
    );
    await page.getByRole("button", { name: "Abrir caja" }).click();
    await expect(page.getByText("Monto inicial contado")).toBeVisible();
  });

  test("sin cajas no ofrece acciones ni pestañas que no hacen nada", async ({
    page,
  }) => {
    await loginAndOpenCash(page, ["cash.view", "cash.operate"], {
      registers: "none",
    });

    await expect(page.getByText("Sin cajas configuradas")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Caja" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Abrir caja" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Turno" })).toHaveCount(0);
  });

  test("con varias cajas el título es un selector de caja", async ({ page }) => {
    await loginAndOpenCash(page, ["cash.view", "cash.operate"], {
      registers: "two",
    });

    await expect(page.getByTestId("pos-session-status")).toContainText(
      "Cajera E2E"
    );
    await page.getByRole("combobox", { name: "Caja" }).click();
    await page.getByRole("option", { name: "Caja 2" }).click();

    await expect(page.getByTestId("pos-session-status")).toHaveText(
      "Sin turno abierto"
    );
    await expect(page.getByRole("button", { name: "Abrir caja" })).toBeVisible();
  });

  test("con el sidebar colapsado las pestañas se abren desde el ícono", async ({
    page,
  }) => {
    await loginAndOpenCash(page, ["cash.view"]);
    await expect(page.getByRole("heading", { name: "Caja 1" })).toBeVisible();

    await page.getByRole("button", { name: "Colapsar menú" }).click();
    await page.getByRole("button", { name: "Caja", exact: true }).click();
    await page.getByRole("menuitem", { name: "Historial" }).click();

    await expect(page.getByText("Historial de turnos")).toBeVisible();
  });

  test("en pantallas chicas las pestañas también están en la página", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 900 });
    await loginAndOpenCash(page, ["cash.view"]);

    const tabs = page.getByRole("navigation", { name: "Caja" });
    await tabs.getByRole("button", { name: "Historial" }).click();

    await expect(page.getByText("Historial de turnos")).toBeVisible();
  });

  test("el sidebar lleva a Caja cuando hay permiso", async ({ page }) => {
    await loginAndOpenCash(page, ["cash.view"]);
    // En Caja el item es el submenú de pestañas; fuera de ella, un link.
    await page.goto("/es/dashboard/orders");

    await page.getByRole("link", { name: "Caja" }).click();
    await expect(page).toHaveURL(/\/dashboard\/cash/);
  });
});

test.describe("Caja — historial, cierre y retiro", () => {
  test("el historial solo lista turnos cerrados", async ({ page }) => {
    await loginAndOpenCash(page, ["cash.view"]);

    await page.getByRole("button", { name: "Historial" }).click();
    await expect(page.getByText("Historial de turnos")).toBeVisible();
    await expect(page.getByText("Cuadró")).toBeVisible();
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
    await page.getByRole("button", { name: "Abrir caja" }).click();
    await lastCloseRequest;
    await expect(
      page.getByText("El último cierre de esta caja dejó $ 40.000", { exact: false })
    ).toBeVisible();
  });

  test("lo por liquidar de la sede avisa pero no bloquea el cierre", async ({
    page,
  }) => {
    await loginAndOpenCash(page, ["cash.view", "cash.close"]);

    await page.getByRole("button", { name: "Cerrar caja" }).click();
    await expect(page.getByText(/Puedes cerrar el turno/)).toBeVisible();
    // Con la caja sin contar hay faltante: pide motivo y no deja cerrar.
    const confirm = page.getByRole("button", { name: /Cerrar caja con/ });
    await expect(confirm).toBeDisabled();
    // Contado = esperado ($ 50.000): sin diferencia no pide motivo.
    await page.getByLabel("Cantidad de $ 50.000").fill("1");
    await expect(confirm).toBeEnabled();
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

    await page.getByRole("button", { name: "Movimiento" }).click();
    await page.getByRole("button", { name: "Retiro", exact: true }).click();
    await page.locator("#cash-movement-auth").click();
    await expect(page.getByRole("option", { name: "Dueña E2E" })).toBeVisible();
    expect(userListRequests).toEqual([]);
  });
});

/** Todos los permisos de un cajero que vende y cobra. */
const CASHIER = [
  "cash.view",
  "cash.operate",
  "order.create",
  "order.view",
  "order.change_payment_status",
];

test.describe("Caja — vender (POS)", () => {
  test("abre en Vender y cobra una venta de mostrador en efectivo", async ({ page }) => {
    const created: Array<Record<string, unknown>> = [];
    await loginAndOpenCash(page, CASHIER, { onCreateOrder: (body) => created.push(body) });

    await expect(page.getByRole("button", { name: "Vender" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    await expect(page.getByTestId("pos-kpi-strip")).toBeVisible();
    // Sin fotos: solo lista, la grilla queda deshabilitada.
    await expect(page.getByTestId("pos-product-list")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Grilla no disponible/ })
    ).toBeDisabled();

    await page.getByRole("button", { name: "Agregar Hamburguesa clásica" }).first().click();
    // Enter agrega el único resultado (lector de código de barras).
    const search = page.getByPlaceholder("Buscar producto o escanear código");
    await search.fill("limonada");
    await search.press("Enter");
    await expect(search).toHaveValue("");
    await expect(page.getByTestId("pos-cart-lines").getByText("Limonada natural")).toBeVisible();

    await page.getByRole("button", { name: /^Cobrar\s*\$ 26\.000/ }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer.getByText("Cobrar venta")).toBeVisible();
    await drawer.getByRole("button", { name: "$ 50.000" }).click();
    await expect(drawer.getByText("$ 24.000")).toBeVisible();
    await drawer.getByRole("button", { name: "Cobrar $ 26.000" }).click();

    await expect(drawer.getByTestId("pos-change")).toHaveText("$ 24.000");
    // Fuera de la ventana de 24 h el recibo por WhatsApp no se puede enviar.
    await expect(drawer.getByRole("button", { name: "WhatsApp" })).toBeDisabled();
    await expect(drawer.getByText(/últimas 24 horas/)).toBeVisible();
    expect(created[0]).toMatchObject({
      deliveryType: "COUNTER",
      paymentMethod: "CASH",
      cash: { sessionId: "sess-1", receivedAmount: 50000 },
    });
    expect(created[0]).not.toHaveProperty("payNow");

    await drawer.getByRole("button", { name: "Nueva venta" }).click();
    await expect(page.getByTestId("pos-cart-lines")).toHaveCount(0);
  });

  test("dentro de la ventana de 24 h deja enviar el recibo por WhatsApp", async ({ page }) => {
    await loginAndOpenCash(page, CASHIER, { whatsappWindow: "OPEN" });

    await page.getByRole("button", { name: "Agregar Hamburguesa clásica" }).first().click();
    await page.getByRole("button", { name: /^Cobrar\s*\$/ }).click();
    const drawer = page.getByRole("dialog");
    await drawer.getByRole("button", { name: /^Cobrar \$/ }).click();
    const sendRequest = page.waitForRequest(
      (request) =>
        request.url().endsWith("/orders/pos-order-1/receipt/whatsapp") &&
        request.method() === "POST"
    );
    await drawer.getByRole("button", { name: "WhatsApp" }).click();
    await sendRequest;
  });

  test("mesa: envía el pedido sin cobrar a la mesa elegida", async ({ page }) => {
    const created: Array<Record<string, unknown>> = [];
    await loginAndOpenCash(page, CASHIER, { onCreateOrder: (body) => created.push(body) });

    await page.getByRole("button", { name: "A la mesa" }).click();
    await page.getByRole("button", { name: "Agregar Limonada natural" }).first().click();
    await page.getByRole("combobox", { name: "Mesa" }).click();
    await page.getByRole("option", { name: "4" }).click();
    await page.getByRole("button", { name: /Enviar pedido · Mesa 4/ }).click();

    await expect.poll(() => created.length).toBe(1);
    expect(created[0]).toMatchObject({
      deliveryType: "DINE_IN",
      tableId: "table-4",
      paymentMethod: "CASH",
    });
    expect(created[0]).not.toHaveProperty("payNow");
    await expect(page.getByTestId("pos-cart-lines")).toHaveCount(0);
  });

  test("recoger: cobrar ahora con datáfono nace pagado sin mover la caja", async ({ page }) => {
    const created: Array<Record<string, unknown>> = [];
    await loginAndOpenCash(page, CASHIER, { onCreateOrder: (body) => created.push(body) });

    await page.getByRole("button", { name: "Recoger" }).click();
    await page.getByRole("button", { name: "Agregar Papas a la francesa" }).first().click();
    await page.locator("#pos-customer-phone").fill("3001112233");
    await page.getByPlaceholder("Nombre del cliente").fill("Laura");
    await page.getByRole("button", { name: /^Cobrar ahora/ }).click();
    const drawer = page.getByRole("dialog");
    await drawer.getByRole("button", { name: "Datáfono" }).click();
    await drawer.getByRole("button", { name: /^Cobrar \$/ }).click();
    await expect(drawer.getByText("Pagado con Datáfono")).toBeVisible();

    expect(created[0]).toMatchObject({
      deliveryType: "PICKUP",
      paymentMethod: "DATAPHONE",
      payNow: true,
      customerName: "Laura",
    });
    expect(created[0]).not.toHaveProperty("cash");
  });

  test("domicilio sin dirección no deja cobrar", async ({ page }) => {
    const created: Array<Record<string, unknown>> = [];
    await loginAndOpenCash(page, CASHIER, { onCreateOrder: (body) => created.push(body) });

    await page.getByRole("button", { name: "Domicilio" }).click();
    await page.getByRole("button", { name: "Agregar Hamburguesa clásica" }).first().click();
    await page.locator("#pos-customer-phone").fill("3001112233");
    await page.getByPlaceholder("Nombre del cliente").fill("Laura");
    await page.getByRole("button", { name: /^Cobrar ahora/ }).click();

    await expect(page.getByText("Ingresa la dirección de entrega")).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(created).toEqual([]);
  });

  test("la nota del producto viaja en el item del pedido", async ({ page }) => {
    const created: Array<Record<string, unknown>> = [];
    await loginAndOpenCash(page, CASHIER, { onCreateOrder: (body) => created.push(body) });

    await page.getByRole("button", { name: "Agregar Hamburguesa clásica" }).first().click();
    await page.getByRole("button", { name: "Nota del producto" }).click();
    await page.getByPlaceholder("Ej.: sin cebolla (opcional)").fill("Sin cebolla");
    await page.getByRole("button", { name: /^Cobrar\s*\$ / }).click();
    const drawer = page.getByRole("dialog");
    await drawer.getByRole("button", { name: /^Cobrar \$/ }).click();

    await expect.poll(() => created.length).toBe(1);
    expect(created[0]).toMatchObject({
      items: [{ productVariantId: "var-0", quantity: 1, notes: "Sin cebolla" }],
    });
  });

  test("con fotos la grilla está disponible y se recuerda la elección", async ({ page }) => {
    await loginAndOpenCash(page, CASHIER, { productImages: true });

    await expect(page.getByTestId("pos-product-grid")).toBeVisible();
    await page.getByRole("button", { name: "Lista", exact: true }).click();
    await expect(page.getByTestId("pos-product-list")).toBeVisible();

    await page.reload();
    await expect(page.getByTestId("pos-product-list")).toBeVisible();
  });

  test("el último tipo de pedido usado se recuerda en la sede", async ({ page }) => {
    await loginAndOpenCash(page, CASHIER);

    await page.getByRole("button", { name: "Recoger" }).click();
    await page.reload();
    await expect(page.getByRole("button", { name: "Recoger" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  test("+ Agregar productos lleva a Vender con la mesa elegida", async ({ page }) => {
    await loginAndOpenCash(page, CASHIER);

    await page.getByRole("button", { name: /Por cobrar/ }).click();
    await page.getByRole("button", { name: "Agregar productos" }).click();

    await expect(page.getByRole("button", { name: "Vender" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    await expect(page.getByRole("button", { name: "A la mesa" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(page.getByRole("combobox", { name: "Mesa" })).toContainText("2");
  });

  test("por liquidar agrupa por persona y se puede plegar", async ({ page }) => {
    await loginAndOpenCash(page, CASHIER);

    await page.getByRole("button", { name: /Por liquidar/ }).click();
    const list = page.getByTestId("settlements-list");
    await expect(list.getByText("Domiciliario · Repartidor E2E")).toBeVisible();
    await expect(list.getByText(/Ana Ruiz · Cl. 45/)).toBeVisible();

    await list.getByRole("button", { name: /Domiciliario · Repartidor E2E/ }).click();
    await expect(list.getByText(/Ana Ruiz/)).toHaveCount(0);
  });
});

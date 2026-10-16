import { test, expect, type Page } from "playwright/test";
import { mockLoginSuccess } from "../helpers/mock-api";
import { mockOrdersDashboard } from "../helpers/mock-orders-api";
import {
  conversationDetail,
  mockConversationsApi,
} from "../helpers/mock-conversations-api";
import { mockBranches } from "../dashboard/dashboard";
import {
  customer,
  mockCustomers,
  mockGlobalCustomerMetrics,
  mockCustomerDetail,
  DETAIL_CUSTOMER_ID,
} from "../customers/customers";
import {
  blockUnmockedApiCalls,
  blockRealtimeSockets,
  mockRefreshSuccess,
  mockBoardPermissions,
  openBoard,
} from "../orders/board";

/**
 * Clientes, Inbox y Conversaciones en el teléfono (diseño "Caja POS
 * móvil"): listas de tarjetas, detalle del cliente con pestañas, hilo del
 * Inbox a pantalla completa con sus acciones y "Sin pedido" de solo lectura.
 */

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const OPERATOR = [
  "order.view",
  "order.create",
  "customer.view",
  "conversation.view",
  "conversation.takeover",
  "conversation.assign",
  "conversation.close",
  "conversation.note",
  "metrics.view",
];

async function login(page: Page, permissions: string[] = OPERATOR): Promise<void> {
  await page.context().clearCookies();
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    // El botón flotante de React Query Devtools (solo en desarrollo) tapa
    // los controles de abajo a la derecha (enviar del redactor).
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = ".tsqd-parent-container { display: none !important; }";
      document.head.appendChild(style);
    });
  });
  await blockUnmockedApiCalls(page);
  await blockRealtimeSockets(page);
  await mockLoginSuccess(page);
  await mockOrdersDashboard(page);
  await mockBranches(page);
  await mockRefreshSuccess(page);
  await mockConversationsApi(page);
  await mockCustomers(page, {
    byPage: {
      "1": [
        customer(1, { name: "Camila Torres" }),
        customer(2, { name: "Julián Mora", totalOrders: 9 }),
      ],
    },
    total: 2,
  });
  await mockGlobalCustomerMetrics(page);
  await mockCustomerDetail(page);
  await mockBoardPermissions(page, permissions);
  await openBoard(page);
}

test.describe("Clientes en el teléfono", () => {
  test("la lista abre el detalle con Resumen, Pedidos y Notas", async ({ page }) => {
    await login(page);
    await page.goto("/es/dashboard/customers");

    const list = page.getByTestId("customers-mobile-list");
    await expect(list.getByText("Camila Torres")).toBeVisible();
    await list.getByText("Camila Torres").click();

    // mockCustomerDetail responde el mismo cliente para cualquier id.
    const detail = page.getByTestId("customer-mobile-detail");
    await expect(detail.getByText("Cliente Detalle")).toBeVisible();
    await expect(detail.getByRole("link", { name: "Llamar" })).toHaveAttribute(
      "href",
      /^tel:/
    );
    await expect(detail.getByText("Total gastado")).toBeVisible();
    await expect(detail.getByText("Pide cada")).toBeVisible();

    await detail.getByRole("tab", { name: "Pedidos" }).click();
    await expect(detail.getByText(/#ABC123/)).toBeVisible();

    await detail.getByRole("tab", { name: "Notas" }).click();
    await expect(detail.getByRole("textbox")).toHaveValue("Nota E2E");

    await detail.getByRole("button", { name: "Volver a clientes" }).click();
    await expect(page).toHaveURL(/\/dashboard\/customers\/?$/);
  });

  test("sin conversación abierta, el acceso queda apagado", async ({ page }) => {
    await login(page);
    await page.route("**/v1/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith("/conversations") && url.searchParams.get("customerId")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: [],
            meta: { page: 1, limit: 1, total: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
          }),
        });
      }
      return route.fallback();
    });
    await page.goto(`/es/dashboard/customers/${DETAIL_CUSTOMER_ID}`);

    const detail = page.getByTestId("customer-mobile-detail");
    await expect(detail.getByText("Cliente Detalle")).toBeVisible();
    await expect(detail.getByRole("link", { name: "Abrir conversación" })).toHaveCount(0);
    await expect(detail.getByText("Abrir conversación")).toBeVisible();
  });
});

test.describe("Inbox en el teléfono", () => {
  test("la lista abre el hilo a pantalla completa y ofrece tomarlo", async ({ page }) => {
    await login(page);
    await page.goto("/es/dashboard/inbox");

    const list = page.getByTestId("inbox-mobile-list");
    // "Todos" es la bandeja por defecto (antes era "Esperando").
    await expect(list.getByRole("tab", { name: /Todos/ })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await list.getByText("Camila Torres").click();

    const thread = page.getByTestId("inbox-mobile-thread");
    await expect(thread.getByTestId("inbox-mobile-status")).toHaveText(
      "Esperando · sin asignar"
    );
    await expect(thread.getByText("¿Me pueden ayudar con un pedido para mañana?")).toBeVisible();

    const takeover = page.waitForRequest(
      (request) => request.method() === "POST" && request.url().includes("/sess-a/takeover")
    );
    await thread.getByRole("button", { name: "Tomar conversación" }).click();
    await takeover;

    await thread.getByRole("button", { name: "Volver al inbox" }).click();
    await expect(page.getByTestId("inbox-mobile-thread")).toHaveCount(0);
    await expect(list).toBeVisible();
  });

  test("las acciones de la conversación suben en una hoja", async ({ page }) => {
    await login(page);
    await page.goto("/es/dashboard/inbox");
    await page.getByTestId("inbox-mobile-list").getByText("Camila Torres").click();

    await page.getByRole("button", { name: "Acciones de la conversación" }).click();
    const sheet = page.getByRole("menu", { name: "Acciones de la conversación" });
    await expect(sheet.getByRole("menuitem", { name: "Asignar a otro operador" })).toBeVisible();
    await expect(sheet.getByRole("menuitem", { name: "Ver cliente" })).toBeVisible();
    await expect(sheet.getByRole("menuitem", { name: "Cerrar conversación" })).toBeVisible();
    // Esperando (no tomada): no hay nada que liberar.
    await expect(sheet.getByRole("menuitem", { name: /Liberar/ })).toHaveCount(0);

    await sheet.getByRole("menuitem", { name: "Asignar a otro operador" }).click();
    // El Dialog del proyecto no expone role="dialog": se ubica por su título.
    await expect(page.getByText("Asignar conversación", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Asignar", exact: true })).toBeVisible();
  });

  test("con la conversación tomada responde o escribe una nota interna", async ({ page }) => {
    await login(page);
    await page.goto("/es/dashboard/inbox");
    await page.getByTestId("inbox-mobile-list").getByText("Julián Mora").click();

    const thread = page.getByTestId("inbox-mobile-thread");
    await expect(thread.getByTestId("inbox-mobile-status")).toHaveText(
      "En atención · asignada a ti"
    );

    const send = page.waitForRequest(
      (request) => request.method() === "POST" && request.url().includes("/sess-b/messages")
    );
    await thread.getByRole("textbox").fill("Ya va en camino");
    await thread.getByRole("button", { name: "Enviar" }).click();
    expect((await send).postDataJSON()).toMatchObject({ text: "Ya va en camino" });

    await thread.getByRole("button", { name: "Nota interna" }).click();
    await expect(thread.getByRole("button", { name: "Escribiendo nota interna" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    const note = page.waitForRequest(
      (request) => request.method() === "POST" && request.url().includes("/sess-b/notes")
    );
    await thread.getByRole("textbox").fill("Cliente frecuente");
    await thread.getByRole("button", { name: "Agregar nota" }).click();
    expect((await note).postDataJSON()).toMatchObject({ text: "Cliente frecuente" });
  });

  test("atendida por otro operador: no ofrece tomarla, sí la nota interna", async ({
    page,
  }) => {
    await login(page);
    await page.route("**/v1/**", async (route) => {
      const url = new URL(route.request().url());
      if (route.request().method() === "GET" && url.pathname.endsWith("/conversations/sess-a")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ...conversationDetail("sess-a"),
            control: "HUMAN",
            assignedUserId: "other-operator",
            assignedTo: { id: "other-operator", name: "Operadora Dos" },
          }),
        });
      }
      return route.fallback();
    });
    await page.goto("/es/dashboard/inbox");
    await page.getByTestId("inbox-mobile-list").getByText("Camila Torres").click();

    const thread = page.getByTestId("inbox-mobile-thread");
    await expect(thread.getByText("La está atendiendo Operadora Dos.")).toBeVisible();
    await expect(thread.getByRole("button", { name: "Tomar conversación" })).toHaveCount(0);

    const note = page.waitForRequest(
      (request) => request.method() === "POST" && request.url().includes("/sess-a/notes")
    );
    await thread.getByRole("button", { name: "Nota interna" }).click();
    await thread.getByRole("textbox").fill("Avisar a la operadora");
    await thread.getByRole("button", { name: "Agregar nota" }).click();
    expect((await note).postDataJSON()).toMatchObject({ text: "Avisar a la operadora" });
  });

  test("el atrás del navegador cierra el hilo y vuelve a la lista", async ({ page }) => {
    await login(page);
    await page.goto("/es/dashboard/inbox");
    await page.getByTestId("inbox-mobile-list").getByText("Camila Torres").click();
    await expect(page.getByTestId("inbox-mobile-thread")).toBeVisible();
    await expect(page).toHaveURL(/session=sess-a/);

    await page.goBack();
    await expect(page.getByTestId("inbox-mobile-thread")).toHaveCount(0);
    await expect(page).toHaveURL(/\/dashboard\/inbox\/?$/);
    await expect(page.getByTestId("inbox-mobile-list")).toBeVisible();
  });

  test("si la lista no carga, muestra el error y no 'sin conversaciones'", async ({ page }) => {
    await login(page);
    await page.route("**/v1/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith("/conversations")) {
        return route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
      }
      return route.fallback();
    });
    await page.goto("/es/dashboard/inbox");

    const list = page.getByTestId("inbox-mobile-list");
    await expect(list.getByRole("alert")).toContainText("No se pudieron cargar", { timeout: 20_000 });
    await expect(list.getByText("No hay conversaciones con estos filtros")).toHaveCount(0);
  });

  test("la barra inferior lleva a Sin pedido y al embudo", async ({ page }) => {
    await login(page);
    await page.goto("/es/dashboard/inbox");

    const nav = page.getByTestId("conversations-mobile-nav");
    await expect(nav.getByRole("link", { name: "Inbox" })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "Embudo del bot" })).toBeVisible();
    await nav.getByRole("link", { name: "Sin pedido" }).click();
    await expect(page).toHaveURL(/\/dashboard\/conversations/);
  });
});

test.describe("Sin pedido en el teléfono", () => {
  test("la tarjeta abre el hilo de solo lectura con sus accesos", async ({ page }) => {
    await login(page);
    await page.goto("/es/dashboard/conversations");

    const list = page.getByTestId("conversations-mobile-list");
    await expect(list.getByRole("button", { name: "Todos" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await list.getByText("Sofía León").click();

    const screen = page.getByTestId("conversation-mobile-readonly");
    await expect(screen.getByText("Abandonada")).toBeVisible();
    await expect(screen.getByText("Quiero hacer un pedido grande para mañana")).toBeVisible();
    await expect(screen.getByRole("link", { name: "Reabrir en Inbox" })).toHaveAttribute(
      "href",
      /\/dashboard\/inbox\/?\?session=sess-c/
    );
    await expect(screen.getByRole("link", { name: "Ver cliente" })).toHaveAttribute(
      "href",
      /\/dashboard\/customers\/cust-c/
    );
    // Solo lectura: no hay redactor.
    await expect(screen.getByRole("textbox")).toHaveCount(0);

    // El atrás del navegador vuelve a la lista.
    await page.goBack();
    await expect(page.getByTestId("conversation-mobile-readonly")).toHaveCount(0);
    await expect(list).toBeVisible();
  });
});

test.describe("Inbox en escritorio", () => {
  test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });

  test("elegir una conversación abre el panel sin sumar historial", async ({ page }) => {
    await login(page);
    await page.goto("/es/dashboard/inbox");
    const before = await page.evaluate(() => window.history.length);

    await page.getByText("Julián Mora").first().click();
    await expect(page).toHaveURL(/session=sess-b/);
    await expect(page.getByPlaceholder("Escribí un mensaje...")).toBeVisible();
    await page.getByText("Camila Torres").first().click();
    await expect(page).toHaveURL(/session=sess-a/);
    expect(await page.evaluate(() => window.history.length)).toBe(before);
  });
});

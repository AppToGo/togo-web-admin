import { test, expect, type Page, type Request } from "playwright/test";
import { mockLoginSuccess } from "../helpers/mock-api";
import { mockOrdersDashboard } from "../helpers/mock-orders-api";
import { mockConversationsApi, session } from "../helpers/mock-conversations-api";
import { mockBranches } from "../dashboard/dashboard";
import {
  blockUnmockedApiCalls,
  blockRealtimeSockets,
  mockRefreshSuccess,
  mockBoardPermissions,
  openBoard,
} from "../orders/board";

/**
 * Inbox de escritorio: filtro único (vista + período) en lugar de las
 * pestañas, scroll infinito de a 20 y badge de no leídos solo en abiertas.
 */

test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });

// Mismo set que el operador de mobile-crm: `openBoard` espera "Nuevo pedido".
const OPERATOR = [
  "order.view",
  "order.create",
  "customer.view",
  "conversation.view",
  "conversation.takeover",
  "conversation.assign",
  "metrics.view",
];

const PAGE_SIZE = 20;

async function login(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await blockUnmockedApiCalls(page);
  await blockRealtimeSockets(page);
  await mockLoginSuccess(page);
  await mockOrdersDashboard(page);
  await mockBranches(page);
  await mockRefreshSuccess(page);
  await mockConversationsApi(page);
  await mockBoardPermissions(page, OPERATOR);
  await openBoard(page);
}

/** Pedido del listado (`GET /conversations`), no del detalle ni del resumen. */
function isListRequest(request: Request): boolean {
  return request.method() === "GET" && new URL(request.url()).pathname.endsWith("/conversations");
}

/** Lista paginada: `total` sesiones numeradas, servidas de a `PAGE_SIZE`. */
async function mockPagedList(page: Page, total: number): Promise<void> {
  await page.route("**/v1/**", (route) => {
    const url = new URL(route.request().url());
    if (!url.pathname.endsWith("/conversations")) return route.fallback();
    const pageNumber = Number(url.searchParams.get("page") ?? "1");
    const start = (pageNumber - 1) * PAGE_SIZE;
    const data = Array.from({ length: Math.min(PAGE_SIZE, total - start) }, (_, i) => {
      const n = start + i + 1;
      return session(`sess-${n}`, {
        customer: { id: `cust-${n}`, name: `Cliente ${n}`, phoneNumber: "+573000000000" },
        unreadCount: 0,
      });
    });
    const totalPages = Math.ceil(total / PAGE_SIZE);
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data,
        meta: {
          page: pageNumber,
          limit: PAGE_SIZE,
          total,
          totalPages,
          hasNextPage: pageNumber < totalPages,
          hasPreviousPage: pageNumber > 1,
        },
      }),
    });
  });
}

test.describe("Inbox: filtros y scroll infinito", () => {
  test("arranca en Todos, sin fecha y pidiendo de a 20", async ({ page }) => {
    // Margen para la primera compilación de la ruta en `next dev`.
    test.setTimeout(60_000);
    await login(page);
    const first = page.waitForRequest(isListRequest, { timeout: 30_000 });
    await page.goto("/es/dashboard/inbox");

    const params = new URL((await first).url()).searchParams;
    expect(params.get("limit")).toBe(String(PAGE_SIZE));
    expect(params.get("page")).toBe("1");
    expect(params.get("control")).toBeNull();
    expect(params.get("assignedTo")).toBeNull();
    expect(params.get("dateFrom")).toBeNull();

    // Sin pestañas: la vista se elige en el filtro.
    await expect(page.getByRole("tab", { name: /Esperando/ })).toHaveCount(0);
    await expect(page.getByText("Camila Torres")).toBeVisible();
  });

  test("el filtro cambia la vista (selección única) y el período", async ({ page }) => {
    await login(page);
    await page.goto("/es/dashboard/inbox");
    await expect(page.getByText("Camila Torres")).toBeVisible();

    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(page.getByRole("radio", { name: /Todos/ })).toHaveAttribute("aria-checked", "true");

    const waiting = page.waitForRequest(
      (r) => isListRequest(r) && new URL(r.url()).searchParams.get("control") === "PENDING_HUMAN"
    );
    await page.getByRole("radio", { name: /Esperando/ }).click();
    await waiting;
    await expect(page.getByRole("radio", { name: /Esperando/ })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("radio", { name: /Todos/ })).toHaveAttribute("aria-checked", "false");

    const withDate = page.waitForRequest(
      (r) => isListRequest(r) && !!new URL(r.url()).searchParams.get("dateFrom")
    );
    await page.getByRole("button", { name: /Todas las fechas/ }).click();
    await page.getByRole("button", { name: /Hoy/ }).click();
    const params = new URL((await withDate).url()).searchParams;
    // El día local completo, no "YYYY-MM-DD" (que cortaría el día en UTC).
    const from = new Date(params.get("dateFrom")!);
    const to = new Date(params.get("dateTo")!);
    expect(to.getTime() - from.getTime()).toBe(24 * 3_600_000 - 1);
    expect(params.get("control")).toBe("PENDING_HUMAN");

    // Limpiar todo vuelve a Todos y sin fecha.
    await page.getByRole("button", { name: "Limpiar todo" }).click();
    await expect(page.getByRole("radio", { name: /Todos/ })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("button", { name: /Todas las fechas/ })).toBeVisible();
  });

  test("al bajar trae la página siguiente", async ({ page }) => {
    await login(page);
    await mockPagedList(page, 45);
    await page.goto("/es/dashboard/inbox");

    await expect(page.getByText("Cliente 1", { exact: true })).toBeVisible();
    await expect(page.getByText("Cliente 21", { exact: true })).toHaveCount(0);

    const second = page.waitForRequest(
      (r) => isListRequest(r) && new URL(r.url()).searchParams.get("page") === "2"
    );
    await page.getByText("Cliente 20", { exact: true }).scrollIntoViewIfNeeded();
    await second;
    await expect(page.getByText("Cliente 21", { exact: true })).toBeAttached();
  });

  test("si falla la página siguiente no reintenta en loop y ofrece reintentar", async ({ page }) => {
    // Backoff de TanStack (~7s por tanda) + un ciclo del refetch sin socket (15s).
    test.setTimeout(90_000);
    await login(page);
    await mockPagedList(page, 45);
    let failSecondPage = true;
    let secondPageRequests = 0;
    await page.route("**/v1/**", (route) => {
      const url = new URL(route.request().url());
      if (!url.pathname.endsWith("/conversations") || url.searchParams.get("page") !== "2") {
        return route.fallback();
      }
      secondPageRequests += 1;
      if (failSecondPage) {
        return route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
      }
      return route.fallback();
    });
    await page.goto("/es/dashboard/inbox");

    await page.getByText("Cliente 20", { exact: true }).scrollIntoViewIfNeeded();
    // TanStack reintenta 3 veces con backoff antes de dar el error.
    const footer = page.getByRole("alert").filter({ hasText: "No se pudieron cargar más" });
    await expect(footer).toBeVisible({ timeout: 20_000 });
    // La lista ya cargada sigue a la vista.
    await expect(page.getByText("Cliente 1", { exact: true })).toBeAttached();

    // Con el sentinel todavía visible no se vuelve a pedir solo, ni siquiera
    // cuando el refetch de respaldo (socket bloqueado en e2e) recarga la lista.
    const afterError = secondPageRequests;
    await page.waitForRequest(
      (r) => isListRequest(r) && new URL(r.url()).searchParams.get("page") === "1",
      { timeout: 25_000 }
    );
    await page.waitForTimeout(2_000);
    expect(secondPageRequests).toBe(afterError);
    await expect(footer).toBeVisible();

    failSecondPage = false;
    await footer.getByRole("button", { name: "Reintentar" }).click();
    await expect(page.getByText("Cliente 21", { exact: true })).toBeAttached();
    await expect(footer).toHaveCount(0);
  });

  test("el badge de no leídos solo aparece en conversaciones abiertas", async ({ page }) => {
    await login(page);
    await page.route("**/v1/**", (route) => {
      const url = new URL(route.request().url());
      if (!url.pathname.endsWith("/conversations")) return route.fallback();
      const data = [
        session("sess-open", {
          customer: { id: "c-open", name: "Abierta Uno", phoneNumber: "+573000000001" },
          unreadCount: 3,
        }),
        session("sess-closed", {
          customer: { id: "c-closed", name: "Cerrada Dos", phoneNumber: "+573000000002" },
          status: "CLOSED",
          unreadCount: 7,
        }),
      ];
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data,
          meta: { page: 1, limit: PAGE_SIZE, total: 2, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
        }),
      });
    });
    await page.goto("/es/dashboard/inbox");

    const open = page.getByRole("button", { name: /Abierta Uno/ });
    const closed = page.getByRole("button", { name: /Cerrada Dos/ });
    await expect(open.getByText("3", { exact: true })).toBeVisible();
    await expect(closed).toBeVisible();
    await expect(closed.getByText("7", { exact: true })).toHaveCount(0);
  });
});

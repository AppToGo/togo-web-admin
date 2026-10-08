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
 * Order status transitions (Parte 5).
 *
 * The live list is served statefully: PATCH updates the order status and
 * subsequent list/detail fetches reflect it, like the backend would.
 *
 *   - "Pasar a proceso" moves the card and patches {status}
 *   - Cancel from the detail dropdown patches CANCELLED
 *   - Failed PATCH (422) shows a toast and moves nothing
 *   - Completing an unpaid READY order is blocked client-side (no PATCH)
 */

const BUSINESS_ID = "e2e-test-business-id";
const BRANCH_ID = "e2e-test-branch-id";

function baseOrder(overrides: Record<string, unknown>) {
  const now = new Date().toISOString();
  return {
    status: "CONFIRMED",
    paymentStatus: "PENDING",
    subtotal: 20000,
    tax: 0,
    total: 20000,
    totalAmount: 20000,
    customerId: "cust-e2e",
    businessId: BUSINESS_ID,
    branchId: BRANCH_ID,
    createdAt: now,
    updatedAt: now,
    customer: { id: "cust-e2e", name: "Cliente E2E", phoneNumber: "+573000000000" },
    items: [{ id: "item-1", productName: "Producto E2E", quantity: 1, unitPrice: 20000 }],
    ...overrides,
  };
}

interface StatusScenario {
  patches: Array<{ orderId: string; body: unknown }>;
}

/** Stateful orders scenario. Register AFTER mockOrdersDashboard. */
async function mockStatusScenario(
  page: Page,
  scenario: StatusScenario,
  opts: { patchError?: { status: number; message: string }; extraLive?: Array<Record<string, unknown>> } = {}
): Promise<void> {
  let deliveryStatus = "CONFIRMED";
  const liveOrders = () => [
    baseOrder({ id: "delivery1", orderNumber: 101, deliveryType: "DELIVERY", status: deliveryStatus }),
    baseOrder({ id: "pickup01", orderNumber: 102, deliveryType: "PICKUP" }),
    ...(opts.extraLive ?? []),
  ];

  await page.route("**/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

    if (path.endsWith("/auth/me/permissions")) return json(["order.view", "order.create"]);
    const statusMatch = path.match(/\/orders\/([^/]+)\/status$/);
    if (statusMatch && request.method() === "PATCH") {
      const body = request.postDataJSON();
      scenario.patches.push({ orderId: statusMatch[1], body });
      if (opts.patchError) {
        return json(
          { message: opts.patchError.message, statusCode: opts.patchError.status },
          opts.patchError.status
        );
      }
      if (statusMatch[1] === "delivery1") deliveryStatus = (body as { status: string }).status;
      return json(baseOrder({ id: statusMatch[1], orderNumber: 101, deliveryType: "DELIVERY", status: deliveryStatus }));
    }
    if (path.endsWith("/orders/delivery1")) {
      return json(
        baseOrder({ id: "delivery1", orderNumber: 101, deliveryType: "DELIVERY", status: deliveryStatus })
      );
    }
    if (path.endsWith("/orders") && !url.searchParams.get("status")) {
      return json(liveOrders());
    }
    await route.fallback();
  });
}

test.describe("Orders — transiciones de estado", () => {
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

  test("Pasar a proceso mueve la tarjeta y patchea el estado", async ({ page }) => {
    const scenario: StatusScenario = { patches: [] };
    await mockStatusScenario(page, scenario);
    await openBoard(page);

    // Next-step button on the #101 card (CONFIRMED → IN_PROGRESS).
    // Cards are the only draggable divs containing the order number.
    const card = page.locator('div[draggable="true"]', {
      has: boardOrderNumber(page, "#101"),
    });
    await card.getByRole("button", { name: "Pasar a proceso" }).click();

    await expect(
      page.locator("li[data-sonner-toast]").getByText(/estado actualizado/i)
    ).toBeVisible({ timeout: 8_000 });
    expect(scenario.patches).toEqual([{ orderId: "delivery1", body: { status: "IN_PROGRESS" } }]);

    // Card detail now reports the new status
    await boardOrderNumber(page, "#101").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 8_000 });
    await expect(dialog.getByRole("button", { name: /en proceso/i }).first()).toBeVisible();
  });

  test("cancelar desde el detalle patchea CANCELLED", async ({ page }) => {
    const scenario: StatusScenario = { patches: [] };
    await mockStatusScenario(page, scenario);
    await openBoard(page);

    await boardOrderNumber(page, "#101").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 8_000 });

    // Status badge dropdown → Cancelada
    await dialog.getByRole("button", { name: /nueva/i }).first().click();
    await page.getByRole("menuitem", { name: "Cancelada" }).click();

    await expect(
      page.locator("li[data-sonner-toast]").getByText(/estado actualizado/i)
    ).toBeVisible({ timeout: 8_000 });
    expect(scenario.patches).toEqual([{ orderId: "delivery1", body: { status: "CANCELLED" } }]);
  });

  test("PATCH fallido muestra toast y no mueve nada", async ({ page }) => {
    const scenario: StatusScenario = { patches: [] };
    await mockStatusScenario(page, scenario, {
      patchError: { status: 422, message: "Transición inválida" },
    });
    await openBoard(page);

    const card = page.locator('div[draggable="true"]', {
      has: boardOrderNumber(page, "#101"),
    });
    await card.getByRole("button", { name: "Pasar a proceso" }).click();

    // The toast carries the backend message (getHumanizedErrorMessage),
    // and the optimistic update rolls back
    await expect(
      page.locator("li[data-sonner-toast]").getByText(/transición inválida/i)
    ).toBeVisible({ timeout: 8_000 });

    // Attempt was sent, but the card stays put
    expect(scenario.patches).toHaveLength(1);
    await expect(boardOrderNumber(page, "#101")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nueva" })).toBeVisible();
  });

  test("completar un READY sin pago se bloquea sin PATCH", async ({ page }) => {
    const scenario: StatusScenario = { patches: [] };
    await mockStatusScenario(page, scenario, {
      extraLive: [
        baseOrder({
          id: "ready01",
          orderNumber: 104,
          status: "READY",
          paymentStatus: "PENDING",
          paymentMethod: "TRANSFER",
        }),
      ],
    });
    await openBoard(page);

    await expect(boardOrderNumber(page, "#104")).toBeVisible();

    const card = page.locator('div[draggable="true"]', {
      has: boardOrderNumber(page, "#104"),
    });
    await card.getByRole("button", { name: "Entregar" }).click();

    await expect(
      page.locator("li[data-sonner-toast]").getByText(/el pago está pendiente/i)
    ).toBeVisible({ timeout: 8_000 });
    expect(scenario.patches).toHaveLength(0);
  });
});

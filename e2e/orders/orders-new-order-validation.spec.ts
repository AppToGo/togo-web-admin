import { test, expect, type Page } from "playwright/test";
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
 * New-order drawer validations (Parte 8).
 *
 * Fixtures mirror orders-new-order.spec.ts (same inventory/branch/tables
 * shape) so both suites model the same backend contract.
 *
 *   - PICKUP needs no address and adds no delivery fee
 *   - Submit without products never calls the backend
 *   - Backend error (422) shows a toast and keeps the drawer open
 *   - Transfer is offered only when the branch enables it
 *   - Submit button shows loading state while the POST is in flight
 */

const BRANCH_ID = "e2e-test-branch-id";

const INVENTORY = [
  { name: "Hamburguesa clásica", category: ["cat-burgers", "Hamburguesas"], price: 18500 },
  { name: "Alitas", category: ["cat-chicken", "Pollo"], price: 22000 },
  { name: "Gaseosa Coca-cola", category: ["cat-drinks", "Bebidas"], price: 4500 },
].map((p, i) => ({
  id: `inv-${i}`,
  businessId: "e2e-test-business-id",
  branchId: BRANCH_ID,
  productVariantId: `var-${i}`,
  productName: p.name,
  productSlug: `p-${i}`,
  basePrice: p.price,
  stock: null,
  isAvailable: true,
  isActivated: true,
  priceOverride: null,
  effectivePrice: p.price,
  categoryId: p.category[0],
  categoryName: p.category[1],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

const BRANCH_DETAIL = {
  id: BRANCH_ID,
  businessId: "e2e-test-business-id",
  name: "Sede Centro",
  isActive: true,
  deliveryConfig: { type: "FLAT", flatFee: 4000 },
  dineInConfig: { enabled: true, allowCustomers: false, allowOperators: true },
  transferOptions: {
    enabled: false,
    options: [] as Array<{ id: string; label: string }>,
  },
};

const TABLES = [
  { id: "table-4", name: "Mesa 4", code: "M4", isActive: true, sortOrder: 1, branchId: BRANCH_ID },
];

interface DrawerApiOptions {
  onCreate?: (body: unknown) => void;
  createError?: { status: number; message: string };
  createDelayMs?: number;
  branchDetail?: typeof BRANCH_DETAIL;
}

/** Drawer endpoints. Register AFTER mockOrdersDashboard. */
async function mockDrawerApi(page: Page, opts: DrawerApiOptions = {}) {
  await page.route("**/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

    if (path.endsWith("/auth/me/permissions")) return json(["order.view", "order.create"]);
    if (path.endsWith(`/branches/${BRANCH_ID}/inventory`)) {
      return json({ items: INVENTORY, total: INVENTORY.length, page: 1, limit: 100 });
    }
    if (path.endsWith(`/branches/${BRANCH_ID}/tables`)) return json(TABLES);
    if (path.endsWith(`/branches/${BRANCH_ID}`)) return json(opts.branchDetail ?? BRANCH_DETAIL);
    if (path.endsWith("/orders") && request.method() === "POST") {
      if (opts.createDelayMs) {
        await new Promise<void>((resolve) => setTimeout(resolve, opts.createDelayMs));
      }
      if (opts.createError) {
        return json(
          { message: opts.createError.message, statusCode: opts.createError.status },
          opts.createError.status
        );
      }
      opts.onCreate?.(request.postDataJSON());
      return json({ orderId: "new-order-1", orderNumber: "16", total: 45500 }, 201);
    }
    await route.fallback();
  });
}

async function openDrawer(page: Page) {
  await openBoard(page);
  await page.getByRole("button", { name: "Nuevo pedido" }).click();
  const drawer = page.getByRole("dialog");
  await expect(drawer.getByRole("heading", { name: "Nuevo pedido" })).toBeVisible();
  return drawer;
}

test.describe("Orders — validaciones del drawer", () => {
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

  test("PICKUP no pide dirección ni suma domicilio", async ({ page }) => {
    const created: unknown[] = [];
    await mockDrawerApi(page, { onCreate: (body) => created.push(body) });
    const drawer = await openDrawer(page);

    await drawer.getByRole("button", { name: "Agregar Gaseosa Coca-cola" }).click();
    await drawer.getByRole("button", { name: "Recoger", exact: true }).click();

    // No address field for pickup
    await expect(drawer.getByPlaceholder("Cl. 45 #12-30, Apto 402")).toHaveCount(0);

    await drawer.getByPlaceholder("300 123 4567").fill("3001234567");
    await drawer.getByPlaceholder("Nombre del cliente").fill("Laura Gómez");
    await drawer.getByRole("button", { name: "Efectivo" }).click();

    // 4.500 without delivery fee
    await expect(drawer.getByRole("button", { name: /Crear pedido/ })).toContainText("4.500");
    await drawer.getByRole("button", { name: /Crear pedido/ }).click();

    await expect(page.getByText("Pedido #16 creado")).toBeVisible();
    expect(created).toEqual([
      {
        branchId: BRANCH_ID,
        deliveryType: "PICKUP",
        paymentMethod: "CASH",
        items: [{ productVariantId: "var-2", quantity: 1 }],
        customerName: "Laura Gómez",
        customerPhone: "+573001234567",
      },
    ]);
  });

  test("submit sin productos no llama al backend", async ({ page }) => {
    let createCallCount = 0;
    await mockDrawerApi(page, { onCreate: () => createCallCount++ });
    const drawer = await openDrawer(page);

    await drawer.getByPlaceholder("300 123 4567").fill("3001234567");
    await drawer.getByPlaceholder("Nombre del cliente").fill("Laura Gómez");
    await drawer.getByPlaceholder("Cl. 45 #12-30, Apto 402").fill("Cl. 45 #12-30");
    await drawer.getByRole("button", { name: "Efectivo" }).click();
    await drawer.getByRole("button", { name: /Crear pedido/ }).click();

    await expect(drawer.getByText("Agrega al menos un producto")).toBeVisible();
    expect(createCallCount).toBe(0);
    // Drawer stays open
    await expect(drawer.getByRole("heading", { name: "Nuevo pedido" })).toBeVisible();
  });

  test("error del backend muestra toast y mantiene el drawer", async ({ page }) => {
    await mockDrawerApi(page, {
      createError: { status: 422, message: "Stock insuficiente" },
    });
    const drawer = await openDrawer(page);

    await drawer.getByRole("button", { name: "Agregar Alitas" }).click();
    await drawer.getByPlaceholder("300 123 4567").fill("3001234567");
    await drawer.getByPlaceholder("Nombre del cliente").fill("Laura Gómez");
    await drawer.getByPlaceholder("Cl. 45 #12-30, Apto 402").fill("Cl. 45 #12-30");
    await drawer.getByRole("button", { name: "Efectivo" }).click();
    await drawer.getByRole("button", { name: /Crear pedido/ }).click();

    await expect(
      page.locator("li[data-sonner-toast]").getByText(/stock insuficiente/i)
    ).toBeVisible({ timeout: 5_000 });
    await expect(drawer.getByRole("heading", { name: "Nuevo pedido" })).toBeVisible();
  });

  test("transferencia solo si la sede la habilita", async ({ page }) => {
    const created: unknown[] = [];
    await mockDrawerApi(page, {
      onCreate: (body) => created.push(body),
      branchDetail: {
        ...BRANCH_DETAIL,
        transferOptions: { enabled: true, options: [{ id: "nequi", label: "Nequi" }] },
      },
    });
    const drawer = await openDrawer(page);

    await drawer.getByRole("button", { name: "Agregar Alitas" }).click();
    await drawer.getByPlaceholder("300 123 4567").fill("3001234567");
    await drawer.getByPlaceholder("Nombre del cliente").fill("Laura Gómez");
    await drawer.getByPlaceholder("Cl. 45 #12-30, Apto 402").fill("Cl. 45 #12-30");

    await expect(drawer.getByRole("button", { name: "Transferencia" })).toBeVisible();
    await drawer.getByRole("button", { name: "Transferencia" }).click();
    await drawer.getByRole("button", { name: /Crear pedido/ }).click();

    await expect(page.getByText("Pedido #16 creado")).toBeVisible();
    expect(created).toEqual([
      expect.objectContaining({
        deliveryType: "DELIVERY",
        paymentMethod: "TRANSFER",
      }),
    ]);
  });

  test("el botón muestra loading durante el POST", async ({ page }) => {
    await mockDrawerApi(page, { createDelayMs: 1500, onCreate: () => {} });
    const drawer = await openDrawer(page);

    await drawer.getByRole("button", { name: "Agregar Alitas" }).click();
    await drawer.getByPlaceholder("300 123 4567").fill("3001234567");
    await drawer.getByPlaceholder("Nombre del cliente").fill("Laura Gómez");
    await drawer.getByPlaceholder("Cl. 45 #12-30, Apto 402").fill("Cl. 45 #12-30");
    await drawer.getByRole("button", { name: "Efectivo" }).click();
    await drawer.getByRole("button", { name: /Crear pedido/ }).click();

    const submitButton = drawer.getByRole("button", { name: /Crear pedido/ });
    await expect(submitButton).toBeDisabled({ timeout: 2_000 });

    await expect(page.getByText("Pedido #16 creado")).toBeVisible({ timeout: 8_000 });
  });
});

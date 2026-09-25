import { test, expect, type Page } from "playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { mockLoginSuccess } from "../helpers/mock-api";
import { mockOrdersDashboard } from "../helpers/mock-orders-api";

/**
 * "Nuevo pedido" desde la pantalla de pedidos: el botón de la columna
 * "Nueva" abre el drawer, el operador arma el pedido (productos con
 * buscador y filtro por categoría, tipo de pedido, método de pago y datos
 * del cliente) y se envía a POST /businesses/:businessId/orders.
 */

const BRANCH_ID = "e2e-test-branch-id";

const INVENTORY = [
  { name: "Hamburguesa clásica", category: ["cat-burgers", "Hamburguesas"], price: 18500 },
  { name: "Hamburguesa doble", category: ["cat-burgers", "Hamburguesas"], price: 26000 },
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
  transferOptions: { enabled: false, options: [] },
};

const TABLES = [
  { id: "table-4", name: "Mesa 4", code: "M4", isActive: true, sortOrder: 1, branchId: BRANCH_ID },
];

/** Endpoints propios del drawer. Registrar DESPUÉS de mockOrdersDashboard. */
async function mockNewOrderApi(page: Page, onCreate: (body: unknown) => void) {
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
    if (path.endsWith(`/branches/${BRANCH_ID}`)) return json(BRANCH_DETAIL);
    if (path.endsWith("/orders") && request.method() === "POST") {
      onCreate(request.postDataJSON());
      return json({ orderId: "new-order-1", orderNumber: "16", total: 45500 }, 201);
    }
    await route.fallback();
  });
}

async function openBoard(page: Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.fillCredentials("test@togo.com", "any-password");
  await loginPage.submit();
  await loginPage.waitForDashboardRedirect();

  // Sincroniza con el Kanban ya hidratado (el tour se monta recién ahí).
  await expect(page.getByRole("button", { name: "Nuevo pedido" })).toBeVisible();

  // Mismos overlays que descarta orders-dine-in-filter.spec.ts.
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
}

test.describe("Orders — nuevo pedido desde el admin", () => {
  let created: unknown[];

  test.beforeEach(async ({ page }) => {
    created = [];
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await mockLoginSuccess(page);
    await mockOrdersDashboard(page);
    await mockNewOrderApi(page, (body) => created.push(body));
  });

  test("crea un pedido a domicilio", async ({ page }) => {
    await openBoard(page);

    await page.getByRole("button", { name: "Nuevo pedido" }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer.getByRole("heading", { name: "Nuevo pedido" })).toBeVisible();

    // Filtro por categoría + buscador
    await drawer.getByRole("button", { name: "Pollo", exact: true }).click();
    await expect(drawer.getByText("Hamburguesa clásica")).toHaveCount(0);
    await drawer.getByRole("button", { name: "Agregar Alitas" }).click();
    await drawer.getByRole("button", { name: "Todos", exact: true }).click();
    await drawer.getByPlaceholder("Buscar producto…").fill("clásica");
    await drawer.getByRole("button", { name: "Agregar Hamburguesa clásica" }).click();
    await drawer.getByRole("button", { name: "Agregar Hamburguesa clásica" }).click();

    // Sin datos del cliente no se envía
    await drawer.getByRole("button", { name: /Crear pedido/ }).click();
    await expect(drawer.getByText("Ingresa la dirección de entrega")).toBeVisible();
    expect(created).toHaveLength(0);

    await drawer.getByPlaceholder("300 123 4567").fill("3001234567");
    await drawer.getByPlaceholder("Nombre del cliente").fill("Laura Gómez");
    await drawer.getByPlaceholder("Cl. 45 #12-30, Apto 402").fill("Cl. 45 #12-30");
    await drawer.getByRole("button", { name: "Efectivo" }).click();

    // 2 × 18.500 + 22.000 + 4.000 de domicilio (tarifa plana)
    await expect(drawer.getByRole("button", { name: /Crear pedido/ })).toContainText("63.000");
    await drawer.getByRole("button", { name: /Crear pedido/ }).click();

    await expect(page.getByText("Pedido #16 creado")).toBeVisible();
    await expect(drawer).toHaveCount(0);
    expect(created).toEqual([
      {
        branchId: BRANCH_ID,
        deliveryType: "DELIVERY",
        paymentMethod: "CASH",
        items: [
          { productVariantId: "var-2", quantity: 1 },
          { productVariantId: "var-0", quantity: 2 },
        ],
        customerName: "Laura Gómez",
        customerPhone: "+573001234567",
        addressText: "Cl. 45 #12-30",
      },
    ]);
  });

  test("pedido para la mesa solo pide la mesa", async ({ page }) => {
    await openBoard(page);

    await page.getByRole("button", { name: "Nuevo pedido" }).click();
    const drawer = page.getByRole("dialog");

    await drawer.getByRole("button", { name: "Agregar Gaseosa Coca-cola" }).click();
    await drawer.getByRole("button", { name: "A la mesa" }).click();
    await expect(drawer.getByPlaceholder("Nombre del cliente")).toHaveCount(0);
    await expect(drawer.getByPlaceholder("Cl. 45 #12-30, Apto 402")).toHaveCount(0);
    // Transferencia no configurada en la sede → no se ofrece
    await expect(drawer.getByRole("button", { name: "Transferencia" })).toHaveCount(0);

    await drawer.getByRole("combobox").click();
    await page.getByRole("option", { name: "Mesa 4" }).click();
    await drawer.getByRole("button", { name: "Datáfono" }).click();
    await drawer.getByRole("button", { name: /Crear pedido/ }).click();

    await expect(page.getByText("Pedido #16 creado")).toBeVisible();
    expect(created).toEqual([
      {
        branchId: BRANCH_ID,
        deliveryType: "DINE_IN",
        paymentMethod: "DATAPHONE",
        items: [{ productVariantId: "var-3", quantity: 1 }],
        tableId: "table-4",
      },
    ]);
  });
});

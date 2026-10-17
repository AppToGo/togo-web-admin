import { test, expect, type Page } from "playwright/test";
import { mockLoginSuccess } from "../helpers/mock-api";
import { mockOrdersDashboard } from "../helpers/mock-orders-api";
import { mockBranches } from "../dashboard/dashboard";
import {
  blockUnmockedApiCalls,
  blockRealtimeSockets,
  mockRefreshSuccess,
  mockBoardPermissions,
  openBoard,
} from "../orders/board";

/**
 * Catálogo y Configuración en el teléfono (diseño "Caja POS móvil"): menú
 * aplanado, Productos · Inventario · Categorías con barra inferior, la lista
 * de Configuración y sus subpantallas con volver en la barra superior.
 */

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const PERMISSIONS = [
  "order.view",
  "order.create",
  "conversation.view",
  "metrics.view",
  "billing.view",
];

const now = new Date().toISOString();

function product(id: string, name: string, price: number, isActive = true) {
  return {
    id,
    businessId: "e2e-test-business-id",
    name,
    slug: id,
    kind: "SIMPLE",
    businessCategoryId: "cat-burgers",
    isActive,
    isFeatured: false,
    searchKeywords: [],
    variantCount: 1,
    priceFrom: price,
    priceTo: price,
    createdAt: now,
    updatedAt: now,
  };
}

function inventoryItem(
  id: string,
  name: string,
  stock: number | null,
  isAvailable = true,
  isActivated = true
) {
  return {
    id,
    businessId: "e2e-test-business-id",
    branchId: "branch-1",
    productVariantId: `var-${id}`,
    productName: name,
    productSlug: id,
    variantLabel: "Unidad",
    basePrice: 18000,
    stock,
    isAvailable,
    isActivated,
    priceOverride: null,
    effectivePrice: 18000,
    createdAt: now,
    updatedAt: now,
  };
}

const USERS = [
  { id: "u-owner", name: "Carolina Vélez", email: "carolina@e2e.co", role: "OWNER", active: true },
  { id: "u-admin", name: "Andrés Rojas", email: "andres@e2e.co", role: "ADMIN", active: true },
  { id: "u-op1", name: "Laura Gómez", email: null, role: "OPERATOR", active: true },
  { id: "u-op2", name: "Mateo Cruz", email: null, role: "OPERATOR", active: false },
].map((user) => ({
  ...user,
  phoneNumber: "+573001112233",
  businessId: "e2e-test-business-id",
  operatorProfileId: null,
  createdAt: now,
  updatedAt: now,
}));

/** Productos, categorías, inventario, usuarios y límite de sedes. */
async function mockCatalogAndSettings(page: Page, patches: unknown[] = []): Promise<void> {
  await page.route("**/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const json = (body: unknown) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

    if (/\/products\/[^/]+$/.test(path) && request.method() === "PATCH") {
      patches.push(request.postDataJSON());
      return json(product("p-1", "Hamburguesa clásica", 18000, false));
    }
    if (path.endsWith("/products")) {
      const items = [
        product("p-1", "Hamburguesa clásica", 18000),
        product("p-2", "Hamburguesa doble", 26000),
        product("p-3", "Pizza vegetariana", 23000, false),
      ];
      const isActive = url.searchParams.get("isActive");
      const filtered =
        isActive === null ? items : items.filter((item) => String(item.isActive) === isActive);
      return json({
        items: filtered,
        total: filtered.length,
        page: 1,
        limit: 20,
        counts: { total: 3, fromTemplate: 0, custom: 3 },
      });
    }
    if (path.includes("/business-categories")) {
      return json([
        {
          id: "cat-burgers",
          name: "Hamburguesas",
          slug: "hamburguesas",
          description: null,
          industryCategoryId: "ic-1",
          businessId: "e2e-test-business-id",
          isActive: true,
          order: 1,
          searchKeywords: [{ value: "burger", source: "manual" }],
        },
        {
          id: "cat-drinks",
          name: "Bebidas",
          slug: "bebidas",
          description: null,
          industryCategoryId: "ic-2",
          businessId: "e2e-test-business-id",
          isActive: true,
          order: 2,
          searchKeywords: [],
        },
      ]);
    }
    // Edición del inventario de la sede.
    const inventoryWrite = path.match(/\/inventory\/([^/]+)(\/availability)?$/);
    if (inventoryWrite && request.method() !== "GET") {
      patches.push({
        method: request.method(),
        target: inventoryWrite[2] ? "availability" : "item",
        productId: inventoryWrite[1],
        body: request.postDataJSON(),
      });
      return json(inventoryItem("i-1", "Hamburguesa clásica", 0));
    }
    if (path.endsWith("/inventory")) {
      const items = [
        inventoryItem("i-1", "Hamburguesa clásica", 0),
        inventoryItem("i-2", "Hamburguesa doble", 4),
        inventoryItem("i-3", "Limonada natural", null),
        inventoryItem("i-4", "Gaseosa", 30, false),
        inventoryItem("i-5", "Malteada", null, false, false),
      ];
      // `total` mayor que lo cargado: la lista móvil avisa que es parcial.
      return json({ items, total: 140, page: 1, limit: 100 });
    }
    if (path.endsWith("/activate") && request.method() === "PATCH") {
      patches.push({ activate: path });
      return json({});
    }
    if (path.includes("/users")) return json(USERS);
    if (path.endsWith("/branches/can-create")) {
      return json({ allowed: true, current: 1, max: 3, remaining: 2 });
    }
    return route.fallback();
  });
}

async function login(
  page: Page,
  patches?: unknown[],
  permissions: string[] = PERMISSIONS
): Promise<void> {
  await page.context().clearCookies();
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    // El botón flotante de React Query Devtools (solo en desarrollo) tapa
    // los controles de abajo a la derecha.
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
  await mockCatalogAndSettings(page, patches);
  await mockBoardPermissions(page, permissions);
  await openBoard(page);
}

test.describe("Menú del teléfono", () => {
  test("Catálogo, Configuración y Conversaciones son una sola entrada", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Abrir menú" }).click();

    await expect(page.getByRole("link", { name: "Catálogo" })).toHaveAttribute(
      "href",
      /\/dashboard\/catalog\/products\/?$/
    );
    await expect(page.getByRole("link", { name: "Configuración" })).toHaveAttribute(
      "href",
      /\/dashboard\/settings\/?$/
    );
    await expect(page.getByRole("link", { name: "Conversaciones" })).toHaveAttribute(
      "href",
      /\/dashboard\/inbox\/?$/
    );
    // Sus hermanas viven en la barra inferior / la lista, no en el menú.
    await expect(page.getByRole("link", { name: /Inventario/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Embudo del bot" })).toHaveCount(0);
  });
});

test.describe("Catálogo en el teléfono", () => {
  test("productos: filtra por estado y apaga un producto desde la lista", async ({ page }) => {
    const patches: unknown[] = [];
    await login(page, patches);
    await page.goto("/es/dashboard/catalog/products");

    const view = page.getByTestId("products-mobile-view");
    await expect(view.getByText("Hamburguesa clásica")).toBeVisible();
    await expect(view.getByText("Pizza vegetariana")).toBeVisible();

    await view.getByRole("button", { name: "Inactivos" }).click();
    await expect(view.getByText("Hamburguesa clásica")).toHaveCount(0);
    await expect(view.getByText("Pizza vegetariana")).toBeVisible();

    await view.getByRole("button", { name: "Todos", exact: true }).click();
    await view.getByRole("switch", { name: "Hamburguesa clásica activo" }).click();
    await expect.poll(() => patches).toContainEqual({ isActive: false });

    await expect(page.getByTestId("products-mobile-create")).toBeVisible();
    const nav = page.getByTestId("catalog-mobile-nav");
    await expect(nav.getByRole("link", { name: "Productos" })).toHaveAttribute("aria-current", "page");
    await nav.getByRole("link", { name: "Inventario" }).click();
    await expect(page).toHaveURL(/\/dashboard\/inventory/);
  });

  test("inventario: stock por estado con sus contadores", async ({ page }) => {
    await login(page);
    await page.goto("/es/dashboard/inventory");

    const view = page.getByTestId("inventory-mobile-view");
    await expect(view.getByText("Hamburguesa clásica")).toBeVisible();
    // La variante por defecto no se repite junto al nombre.
    await expect(view.getByText("Hamburguesa clásica · Unidad")).toHaveCount(0);
    await expect(view.getByRole("button", { name: /Agotados/ })).toContainText("1");
    await expect(view.getByRole("button", { name: /Stock bajo/ })).toContainText("1");

    await view.getByRole("button", { name: /No disponibles/ }).click();
    await expect(view.getByText("Gaseosa")).toBeVisible();
    await expect(view.getByText("Hamburguesa doble")).toHaveCount(0);
    // Sin inventory.set_availability la disponibilidad solo se ve.
    await expect(view.getByRole("switch")).toHaveCount(0);
    await expect(view.getByText("Se muestran 5 de 140", { exact: false })).toBeVisible();
  });

  test("categorías: busca y crea desde el botón flotante", async ({ page }) => {
    await login(page);
    await page.goto("/es/dashboard/catalog/categories");

    const list = page.getByTestId("categories-mobile-list");
    await expect(list.getByText("Palabras clave: burger")).toBeVisible();
    await list.getByRole("searchbox").fill("bebi");
    await expect(list.getByText("Hamburguesas")).toHaveCount(0);
    await expect(list.getByText("Bebidas")).toBeVisible();

    await page.getByTestId("categories-mobile-create").click();
    await expect(page.getByLabel(/Nombre/).first()).toBeVisible();
  });
});

test.describe("Configuración en el teléfono", () => {
  test("la lista lleva a cada pantalla y la barra superior vuelve", async ({ page }) => {
    await login(page);
    await page.goto("/es/dashboard/settings");

    const hub = page.getByTestId("settings-mobile-hub");
    await expect(hub.getByRole("link", { name: /Facturación/ })).toBeVisible();
    await hub.getByRole("link", { name: /Usuarios/ }).click();
    await expect(page).toHaveURL(/\/dashboard\/settings\/users/);
    await expect(page.getByTestId("mobile-section-title")).toHaveText("Usuarios");

    await page.getByTestId("mobile-back").click();
    await expect(page).toHaveURL(/\/dashboard\/settings\/?$/);
    await expect(page.getByTestId("settings-mobile-hub")).toBeVisible();
  });

  test("usuarios: filtra por rol y cada fila abre su detalle", async ({ page }) => {
    await login(page);
    await page.goto("/es/dashboard/settings/users");

    const view = page.getByTestId("users-mobile-view");
    await expect(view.getByRole("button", { name: /Operadores/ })).toContainText("2");
    await view.getByRole("button", { name: /Operadores/ }).click();
    await expect(view.getByText("Carolina Vélez")).toHaveCount(0);
    await expect(view.getByText("Laura Gómez")).toBeVisible();
    await expect(view.getByRole("link", { name: /Mateo Cruz/ })).toHaveAttribute(
      "href",
      /\/dashboard\/users\/u-op2/
    );
  });
});

test.describe("Configuración: permisos y acciones en el teléfono", () => {
  test("sin bot_messages.manage no ofrece Mensajes del bot", async ({ page }) => {
    await login(page);
    await page.goto("/es/dashboard/settings");

    const hub = page.getByTestId("settings-mobile-hub");
    await expect(hub.getByRole("link", { name: /Usuarios/ })).toBeVisible();
    await expect(hub.getByRole("link", { name: /Mensajes del bot/ })).toHaveCount(0);
  });

  test("usuarios: desactivar pide confirmación y reactivar guarda", async ({ page }) => {
    const patches: unknown[] = [];
    await login(page, patches);
    await page.goto("/es/dashboard/settings/users");

    await page.getByRole("button", { name: "Acciones de Andrés Rojas" }).click();
    await page.getByRole("menuitem", { name: "Eliminar usuario" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: "Cancelar" }).click();

    await page.getByRole("button", { name: "Acciones de Mateo Cruz" }).click();
    await page.getByRole("menuitem", { name: "Reactivar usuario" }).click();
    await expect.poll(() => patches).toContainEqual({
      activate: "/v1/businesses/e2e-test-business-id/users/u-op2/activate",
    });
  });

  test("al pasar a escritorio la lista de Configuración redirige", async ({ page }) => {
    await login(page);
    await page.goto("/es/dashboard/settings");
    await expect(page.getByTestId("settings-mobile-hub")).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page).toHaveURL(/\/dashboard\/settings\/general\/business/);
  });
});

test.describe("Menú en la tablet", () => {
  test.use({ viewport: { width: 820, height: 1180 } });

  test("Catálogo conserva su submenú (no hay barra inferior)", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.getByRole("button", { name: "Catálogo" }).click();
    await expect(page.getByRole("link", { name: /Inventario/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Categor/ })).toBeVisible();
  });
});

test.describe("Inventario editable", () => {
  const EDITOR = [...PERMISSIONS, "inventory.set_availability"];

  test("teléfono: apaga desde la fila y edita stock y precio en la hoja", async ({ page }) => {
    const patches: unknown[] = [];
    await login(page, patches, EDITOR);
    await page.goto("/es/dashboard/inventory");
    const view = page.getByTestId("inventory-mobile-view");

    await view.getByRole("switch", { name: "Hamburguesa doble disponible" }).click();
    await expect.poll(() => patches).toContainEqual({
      method: "POST",
      target: "availability",
      productId: "var-i-2",
      body: { isAvailable: false },
    });

    await view.getByText("Hamburguesa clásica").click();
    const sheet = page.getByTestId("inventory-item-sheet");
    await sheet.getByRole("checkbox").check();
    await sheet.getByRole("spinbutton", { name: /Precio en esta sede/ }).fill("16500");
    await sheet.getByRole("button", { name: "Guardar" }).click();
    await expect.poll(() => patches).toContainEqual({
      method: "PATCH",
      target: "item",
      productId: "var-i-1",
      body: { stock: null, priceOverride: 16500 },
    });
    await expect(page.getByTestId("inventory-item-sheet")).toHaveCount(0);
  });

  test("teléfono: un producto sin activar se activa al guardar", async ({ page }) => {
    const patches: unknown[] = [];
    await login(page, patches, EDITOR);
    await page.goto("/es/dashboard/inventory");

    await page.getByTestId("inventory-mobile-view").getByText("Malteada").click();
    const sheet = page.getByTestId("inventory-item-sheet");
    await expect(sheet.getByText("Todavía no está activado", { exact: false })).toBeVisible();
    await sheet.getByRole("button", { name: "Activar en la sede" }).click();
    await expect.poll(() => patches).toContainEqual({
      method: "POST",
      target: "item",
      productId: "var-i-5",
      body: { isAvailable: true },
    });
  });

  test.describe("escritorio", () => {
    test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });

    test("las tarjetas dejan editar con permiso y apagar la disponibilidad", async ({
      page,
    }) => {
      const patches: unknown[] = [];
      await login(page, patches, EDITOR);
      await page.goto("/es/dashboard/inventory");
      const grid = page.getByTestId("inventory-grid");
      await expect(grid.getByText("Hamburguesa doble · Unidad")).toBeVisible();
      await expect(grid.getByText("Quedan 4")).toBeVisible();
      await expect(grid.getByRole("spinbutton").first()).toBeEnabled();

      await grid.getByRole("switch", { name: "Hamburguesa doble · Unidad disponible" }).click();
      await expect.poll(() => patches).toContainEqual({
        method: "POST",
        target: "availability",
        productId: "var-i-2",
        body: { isAvailable: false },
      });

      // Seleccionar abre la barra de acciones masivas.
      await grid.getByRole("checkbox", { name: "Seleccionar Gaseosa · Unidad" }).check();
      await expect(page.getByRole("region", { name: "Acciones con la selección" })).toBeVisible();
    });

    test("sin inventory.set_availability la disponibilidad queda bloqueada", async ({ page }) => {
      await login(page);
      await page.goto("/es/dashboard/inventory");
      const grid = page.getByTestId("inventory-grid");
      await expect(grid.getByText("Hamburguesa doble · Unidad")).toBeVisible();
      await expect(grid.getByRole("switch").first()).toBeDisabled();
    });

    test("categorías en tarjetas: filtra por estado y edita", async ({ page }) => {
      await login(page);
      await page.goto("/es/dashboard/catalog/categories");
      const grid = page.getByTestId("categories-grid");
      await expect(grid.getByRole("listitem")).toHaveCount(2);
      await expect(grid.getByText("burger")).toBeVisible();
      await expect(grid.getByText("Sin palabras clave")).toBeVisible();

      await page.getByRole("button", { name: /Inactivas/ }).click();
      await expect(page.getByText("No se encontraron resultados")).toBeVisible();
      await page.getByRole("button", { name: /Todas/ }).click();

      await grid.getByRole("button", { name: "Editar" }).first().click();
      await expect(page.getByRole("heading", { name: "Editar categoría" })).toBeVisible();
    });
  });
});
